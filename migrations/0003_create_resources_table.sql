-- Migration number: 0003 \t 2026-03-23T00:20:00.000Z
-- Create resources and resource_categories (many-to-many to categories)

CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    thumb TEXT,
    isFree INTEGER DEFAULT 0,
    type INTEGER,
    isHot INTEGER DEFAULT 0,
    isGif INTEGER DEFAULT 0,
    isNew INTEGER DEFAULT 0,
    isMore INTEGER DEFAULT 0,
    isContact INTEGER DEFAULT 0,
    wallpaperType INTEGER,
    packageUrl TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS resource_categories (
    resource_key TEXT NOT NULL,
    category_key TEXT NOT NULL,
    PRIMARY KEY (resource_key, category_key),
    FOREIGN KEY (resource_key) REFERENCES resources(key) ON DELETE CASCADE,
    FOREIGN KEY (category_key) REFERENCES categories(key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_categories_category ON resource_categories (category_key, resource_key);
