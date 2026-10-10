CREATE DATABASE IF NOT EXISTS fastbite
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fastbite;

CREATE TABLE IF NOT EXISTS menu_items (
    menu_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (menu_item_id),
    UNIQUE KEY uq_menu_items_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    order_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    menu_item_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    line_total DECIMAL(10, 2)
        GENERATED ALWAYS AS (unit_price * quantity) STORED,
    PRIMARY KEY (order_item_id),
    KEY ix_order_items_order_id (order_id),
    KEY ix_order_items_menu_item_id (menu_item_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders (order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (menu_item_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO menu_items (name, price) VALUES
    ('Classic Chicken Burger', 450.00),
    ('Zinger Burger', 550.00),
    ('Beef Burger', 750.00),
    ('Chicken Wrap', 450.00),
    ('Zinger Wrap', 550.00),
    ('BBQ Wrap', 550.00),
    ('Regular Fries', 200.00),
    ('Masala Fries', 250.00),
    ('Loaded Fries', 400.00),
    ('Chicken Nuggets (6 Pieces)', 350.00),
    ('Chicken Strips', 400.00),
    ('Chicken Wings', 450.00),
    ('Fried Chicken', 500.00),
    ('Soft Drink', 150.00),
    ('Lemonade', 200.00),
    ('Mint Margrita', 250.00),
    ('Mineral Water', 80.00),
    ('Brownie', 350.00),
    ('Choclate Lava Cake', 400.00),
    ('Oreo Shake', 400.00);
