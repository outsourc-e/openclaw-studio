-- =============================================================================
-- Real-Time Chat Application Database Schema
-- Supports: Channels, Threads, Reactions, Read Receipts
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) NOT NULL UNIQUE,
    display_name    VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    avatar_url      TEXT,
    status          VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'dnd', 'offline')),
    last_seen_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

-- -----------------------------------------------------------------------------
-- Channels
-- -----------------------------------------------------------------------------
CREATE TABLE channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    type            VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    archived_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_created_by ON channels(created_by);

-- -----------------------------------------------------------------------------
-- Channel Memberships
-- -----------------------------------------------------------------------------
CREATE TABLE channel_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    muted           BOOLEAN DEFAULT FALSE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);

-- -----------------------------------------------------------------------------
-- Messages
-- -----------------------------------------------------------------------------
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Thread support: if thread_parent_id is NULL, this is a top-level message
    -- if set, this message is a reply in a thread
    thread_parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    
    -- For edits/deletes
    edited_at       TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    
    -- Metadata (attachments, link previews, etc.)
    metadata        JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary query: messages in a channel, ordered by time
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);

-- Thread queries: find all replies to a parent message
CREATE INDEX idx_messages_thread_parent ON messages(thread_parent_id, created_at ASC) 
    WHERE thread_parent_id IS NOT NULL;

-- User's messages (for search, moderation)
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);

-- Full-text search on message content
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));

-- -----------------------------------------------------------------------------
-- Thread Metadata (denormalized for performance)
-- Tracks reply count and latest activity for thread previews
-- -----------------------------------------------------------------------------
CREATE TABLE thread_metadata (
    message_id      UUID PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
    reply_count     INTEGER NOT NULL DEFAULT 0,
    participant_ids UUID[] DEFAULT '{}',
    last_reply_at   TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Reactions
-- -----------------------------------------------------------------------------
CREATE TABLE reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           VARCHAR(50) NOT NULL,  -- Unicode emoji or custom emoji code
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One reaction type per user per message
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON reactions(message_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- Aggregated reaction counts (for quick display)
CREATE VIEW reaction_counts AS
SELECT 
    message_id,
    emoji,
    COUNT(*) as count,
    ARRAY_AGG(user_id ORDER BY created_at) as user_ids
FROM reactions
GROUP BY message_id, emoji;

-- -----------------------------------------------------------------------------
-- Read Receipts
-- Tracks the last message each user has read in each channel
-- -----------------------------------------------------------------------------
CREATE TABLE read_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(channel_id, user_id)
);

CREATE INDEX idx_read_receipts_channel ON read_receipts(channel_id);
CREATE INDEX idx_read_receipts_user ON read_receipts(user_id);

-- -----------------------------------------------------------------------------
-- Message Read Status (granular per-message receipts for DMs/small channels)
-- Optional: enable for channels that need per-message read tracking
-- -----------------------------------------------------------------------------
CREATE TABLE message_read_status (
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY(message_id, user_id)
);

CREATE INDEX idx_message_read_status_user ON message_read_status(user_id, read_at DESC);

-- -----------------------------------------------------------------------------
-- Typing Indicators (ephemeral, but useful to have schema)
-- In practice, this would be handled in Redis/memory, but here for completeness
-- -----------------------------------------------------------------------------
CREATE TABLE typing_indicators (
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 seconds'),
    
    PRIMARY KEY(channel_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Update thread metadata when a reply is added
CREATE OR REPLACE FUNCTION update_thread_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_parent_id IS NOT NULL THEN
        INSERT INTO thread_metadata (message_id, reply_count, participant_ids, last_reply_at)
        VALUES (NEW.thread_parent_id, 1, ARRAY[NEW.user_id], NEW.created_at)
        ON CONFLICT (message_id) DO UPDATE SET
            reply_count = thread_metadata.reply_count + 1,
            participant_ids = CASE 
                WHEN NEW.user_id = ANY(thread_metadata.participant_ids) 
                THEN thread_metadata.participant_ids
                ELSE array_append(thread_metadata.participant_ids, NEW.user_id)
            END,
            last_reply_at = NEW.created_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_thread_metadata
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_metadata();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_channels_updated_at
    BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- Useful Queries (as views)
-- -----------------------------------------------------------------------------

-- Unread message count per channel per user
CREATE VIEW unread_counts AS
SELECT 
    cm.user_id,
    cm.channel_id,
    COUNT(m.id) as unread_count
FROM channel_members cm
LEFT JOIN read_receipts rr ON rr.channel_id = cm.channel_id AND rr.user_id = cm.user_id
LEFT JOIN messages m ON m.channel_id = cm.channel_id 
    AND m.created_at > COALESCE(rr.last_read_at, cm.joined_at)
    AND m.user_id != cm.user_id
    AND m.deleted_at IS NULL
    AND m.thread_parent_id IS NULL  -- Only count top-level messages
GROUP BY cm.user_id, cm.channel_id;

-- Channel list with last message preview
CREATE VIEW channel_previews AS
SELECT DISTINCT ON (c.id)
    c.id as channel_id,
    c.name,
    c.type,
    m.id as last_message_id,
    m.content as last_message_content,
    m.user_id as last_message_user_id,
    m.created_at as last_message_at
FROM channels c
LEFT JOIN messages m ON m.channel_id = c.id 
    AND m.thread_parent_id IS NULL 
    AND m.deleted_at IS NULL
WHERE c.archived_at IS NULL
ORDER BY c.id, m.created_at DESC;
