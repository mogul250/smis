-- Migration to add many-to-many relationship between teachers and departments
-- This allows teachers to be assigned to multiple departments

-- Create teacher_departments junction table
CREATE TABLE teacher_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    department_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE, -- Indicates if this is the teacher's primary department
    assigned_date DATE DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Prevent duplicate assignments
    UNIQUE KEY unique_teacher_department (teacher_id, department_id),
    
    -- Foreign key constraints
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Index for performance
    INDEX idx_teacher_departments_teacher (teacher_id),
    INDEX idx_teacher_departments_department (department_id)
) ENGINE=InnoDB;

-- Migrate existing data from users.department_id to teacher_departments
-- This preserves existing relationships as primary departments
INSERT INTO teacher_departments (teacher_id, department_id, is_primary, assigned_date)
SELECT 
    id as teacher_id,
    department_id,
    TRUE as is_primary,
    hire_date as assigned_date
FROM users 
WHERE role = 'teacher' 
  AND department_id IS NOT NULL;

-- Add comment to users.department_id for clarity (keep for backward compatibility)
ALTER TABLE users MODIFY COLUMN department_id INT COMMENT 'Primary department - use teacher_departments table for full many-to-many relationships';
