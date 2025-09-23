-- Create activity_logs table for tracking user activities
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  description TEXT NOT NULL,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some sample activity data for testing
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata) VALUES
(9, 'login', 'auth', NULL, 'Admin user logged in', '{"login_method": "email"}'),
(9, 'user_created', 'user', 8, 'Created new teacher account', '{"role": "teacher", "email": "john.doe@test.com"}'),
(9, 'user_updated', 'user', 7, 'Updated user profile information', '{"fields_updated": ["email", "department"]}'),
(9, 'fee_created', 'fee', 1, 'Created new fee entry for student', '{"amount": 500, "type": "tuition"}'),
(9, 'system_backup', 'system', NULL, 'System backup completed successfully', '{"backup_size": "2.5GB", "duration": "15min"}'),
(8, 'login', 'auth', NULL, 'Teacher logged in', '{"login_method": "email"}'),
(8, 'attendance_marked', 'attendance', 1, 'Marked attendance for Mathematics class', '{"class": "Mathematics 101", "present": 25, "absent": 3}'),
(8, 'grade_updated', 'grade', 1, 'Updated student grades', '{"course": "Mathematics", "students_affected": 5}'),
(7, 'login', 'auth', NULL, 'HOD logged in', '{"login_method": "email"}'),
(7, 'course_approved', 'course', 1, 'Approved new course curriculum', '{"course": "Advanced Mathematics", "department": "Mathematics"}'),
(6, 'payment_received', 'payment', 1, 'Student fee payment processed', '{"amount": 500, "method": "bank_transfer"}'),
(6, 'invoice_generated', 'invoice', 1, 'Generated invoice for semester fees', '{"amount": 1500, "due_date": "2025-10-15"}');
