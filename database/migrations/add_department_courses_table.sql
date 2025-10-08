-- Migration to add many-to-many relationship between departments and courses
-- This allows departments to have multiple courses and courses to belong to multiple departments

-- Create department_courses junction table
CREATE TABLE department_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    assigned_date DATE DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Prevent duplicate assignments
    UNIQUE KEY unique_department_course (department_id, course_id),
    
    -- Foreign key constraints
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Index for performance
    INDEX idx_department_courses_department (department_id),
    INDEX idx_department_courses_course (course_id)
) ENGINE=InnoDB;

-- Migrate existing data from courses.department_id to department_courses
-- This preserves existing relationships if any exist
INSERT IGNORE INTO department_courses (department_id, course_id, assigned_date)
SELECT 
    department_id,
    id as course_id,
    created_at as assigned_date
FROM courses 
WHERE department_id IS NOT NULL;

-- Add comment to courses.department_id for clarity (keep for backward compatibility)
ALTER TABLE courses MODIFY COLUMN department_id INT COMMENT 'Legacy department assignment - use department_courses table for full many-to-many relationships';
