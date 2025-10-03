-- Sample data for testing timetable functionality

-- Insert sample classes if they don't exist
INSERT IGNORE INTO classes (id, academic_year, name, start_date, end_date, students, created_by, department_id, is_active) VALUES
(1, '2024-2025', 'Computer Science Year 1', '2024-09-01', '2025-06-30', '[]', 1, 1, 1),
(2, '2024-2025', 'Computer Science Year 2', '2024-09-01', '2025-06-30', '[]', 1, 1, 1),
(3, '2024-2025', 'Mathematics Year 1', '2024-09-01', '2025-06-30', '[]', 1, 2, 1),
(4, '2024-2025', 'Physics Year 1', '2024-09-01', '2025-06-30', '[]', 1, 3, 1);

-- Insert sample courses if they don't exist
INSERT IGNORE INTO courses (id, course_code, name, description, credits, semester) VALUES
(1, 'CS101', 'Introduction to Computer Science', 'Basic programming concepts', 3, 'Fall 2024'),
(2, 'MATH201', 'Calculus I', 'Differential and integral calculus', 4, 'Fall 2024'),
(3, 'PHY101', 'Physics I', 'Mechanics and thermodynamics', 3, 'Fall 2024'),
(4, 'ENG101', 'English Composition', 'Academic writing skills', 3, 'Fall 2024');

-- Insert sample departments if they don't exist
INSERT IGNORE INTO departments (id, code, name, head_id) VALUES
(1, 'CS', 'Computer Science', NULL),
(2, 'MATH', 'Mathematics', NULL),
(3, 'PHY', 'Physics', NULL),
(4, 'ENG', 'English', NULL);
