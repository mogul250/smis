-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  student_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  due_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  payment_date DATE NULL,
  payment_method VARCHAR(50) NULL,
  transaction_id VARCHAR(100) NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date),
  INDEX idx_invoice_number (invoice_number)
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_id (invoice_id)
);

-- Insert sample invoices for testing
INSERT IGNORE INTO invoices (
  invoice_number, student_id, total_amount, due_date, issue_date, 
  status, notes, created_at, updated_at
) VALUES 
(
  'INV-2024-001', 1, 1200.00, '2024-11-15', '2024-10-01', 
  'sent', 'Semester tuition fee', NOW(), NOW()
),
(
  'INV-2024-002', 1, 150.00, '2024-10-20', '2024-10-05', 
  'paid', 'Library fine and lab equipment', NOW(), NOW()
),
(
  'INV-2024-003', 1, 800.00, '2024-12-01', '2024-10-10', 
  'draft', 'Examination fees', NOW(), NOW()
);

-- Insert sample invoice items
INSERT IGNORE INTO invoice_items (invoice_id, description, amount, quantity) VALUES 
(1, 'Tuition Fee - Fall Semester 2024', 1000.00, 1),
(1, 'Technology Fee', 100.00, 1),
(1, 'Student Activity Fee', 100.00, 1),
(2, 'Library Late Return Fine', 25.00, 1),
(2, 'Lab Equipment Replacement', 125.00, 1),
(3, 'Final Examination Fee', 500.00, 1),
(3, 'Certificate Processing Fee', 300.00, 1);

-- Update invoice status to overdue for invoices past due date
UPDATE invoices 
SET status = 'overdue' 
WHERE status IN ('sent') 
AND due_date < CURDATE();
