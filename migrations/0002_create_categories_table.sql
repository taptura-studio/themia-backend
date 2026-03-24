-- Migration number: 0002 \t 2026-03-23T00:00:00.000Z
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type INTEGER,
    lockType INTEGER,
    size INTEGER,
    copyrightLevel INTEGER
);

INSERT INTO categories (key, name, type, lockType, size, copyrightLevel) VALUES
    -- type 9 set (original)
    ('V8XWhNLYkZ', 'New', 9, 0, 0, 3),
    ('qxdlgMtKbz', '🍀Green', 9, 0, 0, 3),
    ('Jhtf2b2QGA', 'Pink', 9, 0, 0, 3),
    ('SsC0WrCIJU', 'Black', 9, 0, 0, 3),
    ('V3zvldPJq2', 'Cute', 9, 0, 0, 3),
    ('wkUm3LWDzS', 'Aesthetic', 9, 0, 0, 3),
    ('MDVEwlJj7b', 'Plush', 9, 0, 0, 3),
    ('GVNEzKLWgd', 'Flower', 9, 0, 0, 3),
    ('mztXXw4wjN', 'Blue', 9, 0, 0, 3),
    ('n8vO_t0Ouu', 'Car', 9, 0, 0, 3),
    ('TRDXfe2ZBj', 'Pastel', 9, 0, 0, 3),
    ('yqXrEM4U2t', 'Nature', 9, 0, 0, 3),
    ('J6EGYz7Gi-', 'Vibe', 9, 0, 0, 3),
    ('81zHMlMInF', 'OS 26', 9, 0, 0, 3),
    ('U2mXQGfFQ9', 'Aura', 9, 0, 0, 3),
    ('Z2tSbXqP8P', 'Recommend', 9, 0, 0, 3),
    -- type 1 set (latest feed)
    ('BvQGZLySMM', 'New', 1, 0, 0, 3),
    ('X_Dfn04kXN', 'Popular', 1, 0, 0, 3),
    ('JHFXIsYJbS', 'Liquid', 1, 0, 0, 3),
    ('cktMcsrvzX', 'Aura', 1, 0, 0, 3),
    ('Ls1IP6B_h7', 'Cityscapes', 1, 0, 0, 3);
