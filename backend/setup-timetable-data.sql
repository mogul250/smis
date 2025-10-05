-- Setup script for SMIS timetable data based on actual database schema
-- This script works with the existing schema.sql structure

-- Select the SMIS database
USE smis;

-- Insert sample departments (if not exists)
INSERT IGNORE INTO departments (id, code, name) VALUES
(1, 'CS', 'Computer Science'),
(2, 'MATH', 'Mathematics'),
(3, 'ENG', 'English'),
(4, 'PHY', 'Physics');

-- Insert sample teachers (users with teacher role)
INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash, role, department_id, staff_id) VALUES
(1, 'John', 'Smith', 'john.smith@smis.edu', '$2b$10$dummy.hash.for.testing', 'teacher', 1, 'T001'),
(2, 'Jane', 'Doe', 'jane.doe@smis.edu', '$2b$10$dummy.hash.for.testing', 'teacher', 2, 'T002'),
(3, 'Sarah', 'Wilson', 'sarah.wilson@smis.edu', '$2b$10$dummy.hash.for.testing', 'teacher', 3, 'T003'),
(4, 'Michael', 'Brown', 'michael.brown@smis.edu', '$2b$10$dummy.hash.for.testing', 'teacher', 4, 'T004'),
(5, 'Emily', 'Davis', 'emily.davis@smis.edu', '$2b$10$dummy.hash.for.testing', 'teacher', 1, 'T005');

-- Insert sample student (for testing)
INSERT IGNORE INTO students (id, first_name, last_name, email, password_hash, department_id, student_id, enrollment_year, current_year) VALUES
(1, 'Test', 'Student', 'student@smis.edu', '$2b$10$dummy.hash.for.testing', 1, 'S001', 2024, 1);

-- Insert sample courses (using the correct schema structure)
INSERT IGNORE INTO courses (id, course_code, name, description, credits, semester) VALUES
(1, 'CS101', 'Introduction to Computer Science', 'Basic programming and computer science concepts', 3, 'Fall'),
(2, 'MATH101', 'Calculus I', 'Differential and integral calculus', 4, 'Fall'),
(3, 'ENG101', 'English Composition', 'Academic writing and communication skills', 3, 'Fall'),
(4, 'PHY101', 'Physics I', 'Mechanics and thermodynamics', 4, 'Fall'),
(5, 'CS201', 'Database Systems', 'Database design and management', 3, 'Spring'),
(6, 'CS301', 'Web Development', 'Modern web development technologies', 3, 'Spring');

-- Insert sample classes
INSERT IGNORE INTO classes (id, academic_year, name, start_date, end_date, students, created_by, department_id) VALUES
(1, '2024-2025', 'CS Year 1', '2024-09-01', '2025-06-30', '[1]', 1, 1),
(2, '2024-2025', 'Math Year 1', '2024-09-01', '2025-06-30', '[1]', 1, 2);

-- Link classes with courses
INSERT IGNORE INTO class_courses (class_id, course_id) VALUES
(1, 1), -- CS Year 1 takes CS101
(1, 2), -- CS Year 1 takes MATH101
(1, 3), -- CS Year 1 takes ENG101
(1, 4), -- CS Year 1 takes PHY101
(1, 5), -- CS Year 1 takes CS201
(1, 6); -- CS Year 1 takes CS301

-- Enroll the test student in courses
INSERT IGNORE INTO course_enrollments (student_id, course_id, enrollment_date, status) VALUES
(1, 1, '2024-09-01', 'enrolled'),
(1, 2, '2024-09-01', 'enrolled'),
(1, 3, '2024-09-01', 'enrolled'),
(1, 4, '2024-09-01', 'enrolled'),
(1, 5, '2024-09-01', 'enrolled'),
(1, 6, '2024-09-01', 'enrolled');

-- Insert sample timetable data (using the correct schema structure)
INSERT IGNORE INTO timetable (id, course_id, teacher_id, class_id, day_of_week, start_time, end_time, semester, academic_year) VALUES
(1, 1, 1, 1, 1, '09:00:00', '10:30:00', 'Fall', '2024-2025'),    -- CS101 Monday
(2, 2, 2, 1, 1, '11:00:00', '12:30:00', 'Fall', '2024-2025'),    -- MATH101 Monday
(3, 3, 3, 1, 3, '14:00:00', '15:30:00', 'Fall', '2024-2025'),    -- ENG101 Wednesday
(4, 4, 4, 1, 5, '10:00:00', '11:30:00', 'Fall', '2024-2025'),    -- PHY101 Friday
(5, 5, 5, 1, 2, '13:00:00', '14:30:00', 'Spring', '2024-2025'),  -- CS201 Tuesday
(6, 6, 1, 1, 4, '15:00:00', '16:30:00', 'Spring', '2024-2025');  -- CS301 Thursday

-- Display the created data
SELECT 'Departments:' as info;
SELECT * FROM departments WHERE id <= 4;

SELECT 'Teachers:' as info;
SELECT id, first_name, last_name, email, role, department_id FROM users WHERE role = 'teacher' AND id <= 5;

SELECT 'Students:' as info;
SELECT id, first_name, last_name, email, student_id, department_id FROM students WHERE id = 1;

SELECT 'Courses:' as info;
SELECT * FROM courses WHERE id <= 6;

SELECT 'Classes:' as info;
SELECT id, academic_year, name, department_id FROM classes WHERE id <= 2;

SELECT 'Course Enrollments:' as info;
SELECT * FROM course_enrollments WHERE student_id = 1;

SELECT 'Timetable:' as info;
SELECT * FROM timetable WHERE id <= 6;

SELECT 'Student Timetable Query Result:' as info;
SELECT 
    t.id,
    t.day_of_week,
    t.start_time,
    t.end_time,
    t.semester,
    t.academic_year,
    c.course_code,
    c.name as course_name,
    CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
    cl.name as class_name
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
JOIN timetable t ON t.course_id = c.id
JOIN users u ON t.teacher_id = u.id
JOIN classes cl ON t.class_id = cl.id
WHERE ce.student_id = 1 
  AND ce.status = 'enrolled'
ORDER BY t.day_of_week, t.start_time;
