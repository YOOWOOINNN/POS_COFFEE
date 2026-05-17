-- Coffee shop POS database schema and seed data
-- Dialect: SQLite

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_user_id INTEGER NOT NULL,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME DEFAULT NULL,
  opening_cash NUMERIC NOT NULL DEFAULT 0.00,
  closing_cash NUMERIC DEFAULT NULL,
  note TEXT,
  FOREIGN KEY (staff_user_id) REFERENCES staff_users(id),
  CONSTRAINT shifts_cash_check CHECK (opening_cash >= 0 AND (closing_cash IS NULL OR closing_cash >= 0))
);

CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL DEFAULT 0.00,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  prep_minutes INTEGER NOT NULL DEFAULT 3,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  CONSTRAINT products_price_check CHECK (price >= 0 AND cost_price >= 0),
  CONSTRAINT products_stock_check CHECK (stock_qty >= 0 AND reorder_level >= 0)
);

CREATE TABLE IF NOT EXISTS cafe_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_code TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available',
  CONSTRAINT cafe_tables_status_check CHECK (status IN ('available', 'occupied', 'reserved', 'inactive'))
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customers_points_check CHECK (loyalty_points >= 0)
);

CREATE TABLE IF NOT EXISTS discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  starts_at DATETIME DEFAULT NULL,
  ends_at DATETIME DEFAULT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT discounts_type_check CHECK (discount_type IN ('percent', 'fixed')),
  CONSTRAINT discounts_value_check CHECK (value >= 0)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  shift_id INTEGER DEFAULT NULL,
  staff_user_id INTEGER DEFAULT NULL,
  customer_id INTEGER DEFAULT NULL,
  table_id INTEGER DEFAULT NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in',
  status TEXT NOT NULL DEFAULT 'paid',
  subtotal NUMERIC NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC NOT NULL DEFAULT 0.00,
  service_amount NUMERIC NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC NOT NULL DEFAULT 0.00,
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (staff_user_id) REFERENCES staff_users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (table_id) REFERENCES cafe_tables(id),
  CONSTRAINT orders_type_check CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  CONSTRAINT orders_status_check CHECK (status IN ('draft', 'held', 'paid', 'void', 'refunded')),
  CONSTRAINT orders_amount_check CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND service_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
  )
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT order_items_qty_check CHECK (qty > 0),
  CONSTRAINT order_items_amount_check CHECK (unit_price >= 0 AND line_total >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL DEFAULT 0.00,
  reference_no TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT payments_method_check CHECK (method IN ('cash', 'qris', 'debit', 'e_wallet', 'bank_transfer')),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  CONSTRAINT payments_amount_check CHECK (amount >= 0 AND paid_amount >= 0 AND change_amount >= 0)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  qty INTEGER NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  note TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES staff_users(id),
  CONSTRAINT inventory_type_check CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste')),
  CONSTRAINT inventory_qty_check CHECK (qty <> 0)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_staff_user_id ON orders(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_movements(product_id);

DROP VIEW IF EXISTS daily_sales_summary;
CREATE VIEW daily_sales_summary AS
SELECT
  DATE(o.created_at) AS sales_date,
  COUNT(*) AS transaction_count,
  SUM(o.total_amount) AS gross_sales,
  SUM(o.discount_amount) AS discount_total,
  SUM(o.tax_amount) AS tax_total,
  AVG(o.total_amount) AS average_ticket
FROM orders o
WHERE o.status = 'paid'
GROUP BY DATE(o.created_at)
ORDER BY sales_date DESC;

DROP VIEW IF EXISTS low_stock_products;
CREATE VIEW low_stock_products AS
SELECT
  p.id,
  p.sku,
  p.name,
  c.name AS category_name,
  p.stock_qty,
  p.reorder_level
FROM products p
JOIN product_categories c ON c.id = p.category_id
WHERE p.stock_qty <= p.reorder_level
ORDER BY p.stock_qty ASC, p.name ASC;

INSERT OR IGNORE INTO roles (name) VALUES
  ('owner'),
  ('manager'),
  ('cashier'),
  ('barista');

INSERT OR IGNORE INTO staff_users (role_id, full_name, email, password_hash)
SELECT id, 'Admin Bar', 'admin@kopikasir.local', '$2b$10$replace_with_real_hash'
FROM roles 
WHERE name = 'cashier';

INSERT OR IGNORE INTO product_categories (name, slug, sort_order) VALUES
  ('Kopi', 'kopi', 1),
  ('Non-kopi', 'non-kopi', 2),
  ('Makanan', 'makanan', 3),
  ('Beans', 'beans', 4);

INSERT INTO products (category_id, sku, name, description, price, cost_price, stock_qty, reorder_level, prep_minutes) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'COF-ESP', 'Espresso', 'Double shot arabica, body tebal', 22000, 8500, 46, 10, 3),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'COF-AMR', 'Americano', 'Espresso dengan air panas bersih', 26000, 9000, 52, 10, 4),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'COF-CAP', 'Cappuccino', 'Foam susu halus dan espresso house blend', 33000, 13000, 34, 10, 5),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'COF-CLT', 'Caramel Latte', 'Latte creamy dengan karamel ringan', 38000, 15000, 29, 10, 5),
  ((SELECT id FROM product_categories WHERE slug = 'kopi'), 'COF-CBR', 'Cold Brew', 'Seduhan 18 jam, rendah asam', 36000, 14000, 18, 8, 2),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'NON-MCH', 'Matcha Latte', 'Matcha premium dengan susu segar', 37000, 15500, 17, 8, 5),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'NON-CHO', 'Signature Chocolate', 'Cokelat pekat, cocok panas atau dingin', 34000, 14500, 22, 8, 4),
  ((SELECT id FROM product_categories WHERE slug = 'non-kopi'), 'NON-LTE', 'Lemon Tea', 'Teh hitam, lemon, dan simple syrup', 24000, 7500, 41, 8, 3),
  ((SELECT id FROM product_categories WHERE slug = 'makanan'), 'FOD-CRS', 'Butter Croissant', 'Pastry butter, dipanaskan sebelum saji', 28000, 13000, 12, 6, 6),
  ((SELECT id FROM product_categories WHERE slug = 'makanan'), 'FOD-BNB', 'Banana Bread', 'Roti pisang lembut dengan walnut', 30000, 12000, 9, 6, 4),
  ((SELECT id FROM product_categories WHERE slug = 'makanan'), 'FOD-CHT', 'Cheese Toast', 'Roti sourdough dengan keju leleh', 42000, 18000, 14, 6, 7),
  ((SELECT id FROM product_categories WHERE slug = 'beans'), 'BEA-HBL', 'House Blend 250g', 'Beans medium roast untuk espresso', 98000, 58000, 8, 5, 1)
ON CONFLICT(sku) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cost_price = excluded.cost_price,
  stock_qty = excluded.stock_qty,
  reorder_level = excluded.reorder_level,
  prep_minutes = excluded.prep_minutes;

INSERT OR IGNORE INTO cafe_tables (table_code, capacity, status) VALUES
  ('A1', 2, 'available'),
  ('A2', 2, 'available'),
  ('B1', 4, 'available'),
  ('B2', 4, 'available'),
  ('C1', 6, 'available');

INSERT OR IGNORE INTO discounts (code, name, discount_type, value) VALUES
  ('MEMBER10', 'Member 10%', 'percent', 10),
  ('STAFF15', 'Staff 15%', 'percent', 15);
