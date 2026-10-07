-- V3__seed_demo.sql — Phase 1 demo seeds, 1:1 with lms-frontend/js/mock/data.js
-- (+ derived collections from js/db.js buildSeeds: modules/lessons/enrollments/
-- lessonProgress/submissions/announcements).
-- Dates are RELATIVE (DATE_ADD(NOW(), ...)) so due-date/overdue rules stay
-- meaningful no matter when the migration runs.
-- Deviations (documented, FK-forced): cs320/cs330 instructor_id NULL (104/105 are
-- directory-only names, not users — instructor_name preserved); s3 reassigned to
-- student 202 (Sneha/204 is not a user).

-- ---------------- users (8, demo ids preserved) ----------------
INSERT INTO users (id, name, email, password_hash, role, status, dept, program, year_label, title, last_active_at, joined_label) VALUES
(101, 'Dr. Priya Sharma', 'faculty@learnhub.com', '$2a$10$Sp/MVUhSTPYtDX1QegDsf.TFSzWygfqc9vQT.VEU70bxTV9WeTZr.', 'faculty', 'active', 'Computer Science', NULL, NULL, 'Professor', DATE_SUB(NOW(), INTERVAL 2 HOUR), '02 Jun 2015'),
(201, 'Alex Johnson', 'student@learnhub.com', '$2a$10$Z2iRpKKIK.TzoCAQldIdOu99ri/yXVNSTuWmvhswz5XIK26Rf0iYu', 'student', 'active', 'Computer Science', 'B.Tech CSE', '3rd Year', NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR), '12 Aug 2024'),
(5, 'Rahul Verma', 'admin@learnhub.com', '$2a$10$kfDhuP7/srhcArezHHfG8.TfoKIDDBUzxWinmh0XH7PSbR3lz/4Fi', 'admin', 'active', 'Administration', NULL, NULL, 'System Administrator', DATE_SUB(NOW(), INTERVAL 1 HOUR), '01 Jan 2019'),
(102, 'Prof. Rohan Mehta', 'rohan.mehta@learnhub.edu', '$2a$10$z9SerODrT3tU1VPvw3WU6OEnSVZG/1LGB5HQbZ7zmbAif9pyzA1Qa', 'faculty', 'active', 'Computer Science', NULL, NULL, 'Associate Professor', DATE_SUB(NOW(), INTERVAL 10 HOUR), 'Aug 2018'),
(103, 'Dr. Anjali Rao', 'anjali.rao@learnhub.edu', '$2a$10$l0XMU9shZhQBqQVZ4FF4e.4eFnJmvPNxECXfILzdw2cp4NVwZEHo.', 'faculty', 'active', 'Information Technology', NULL, NULL, 'Professor', DATE_SUB(NOW(), INTERVAL 14 HOUR), 'Jan 2019'),
(202, 'Meera Patel', 'meera.p@learnhub.edu', '$2a$10$eF7LvDKRCAYvOof09ZjzwuwNtxD34A5tgjtWr/.zlkQtqVQ09ABp2', 'student', 'active', 'Computer Science', 'B.Tech CSE', '3rd Year', NULL, DATE_SUB(NOW(), INTERVAL 7 HOUR), 'Aug 2024'),
(203, 'Rohan Gupta', 'rohan.g@learnhub.edu', '$2a$10$z9SerODrT3tU1VPvw3WU6OEnSVZG/1LGB5HQbZ7zmbAif9pyzA1Qa', 'student', 'active', 'Information Technology', 'B.Tech IT', '2nd Year', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Aug 2025'),
(207, 'Aditya Kumar', 'aditya.k@learnhub.edu', '$2a$10$SststGmesser.ZTFAp6M6OKR/UnpIu/UxP09hzWnmR2tarRK9he2O', 'student', 'active', 'Information Technology', 'B.Tech IT', '3rd Year', NULL, DATE_SUB(NOW(), INTERVAL 19 HOUR), 'Aug 2024');

-- ---------------- courses (6; cs330 status NULL = legacy published) ----------------
INSERT INTO courses (id, code, name, short_name, description, category, instructor_id, instructor_name, accent, credits, semester, status, students_count) VALUES
('cs201', 'CS 201', 'Data Structures & Algorithms', 'Data Structures & Algorithms', 'A rigorous introduction to fundamental data structures — arrays, linked lists, stacks, queues, trees, heaps and graphs — along with the core algorithms that operate on them. Emphasis is on asymptotic analysis, correctness and practical implementation.', 'Programming', 101, 'Dr. Priya Sharma', 'blue', 4, 'Fall 2026', 'published', 156),
('cs220', 'CS 220', 'Database Management Systems', 'Database Management Systems', 'Design, implement and query relational databases. Covers the relational model, SQL, normalization, indexing, transactions and database design with a strong practical component using MySQL.', 'Data', 102, 'Prof. Rohan Mehta', 'green', 4, 'Fall 2026', 'published', 178),
('cs340', 'CS 340', 'Computer Networks', 'Computer Networks', 'Understand the layered architecture of modern networks. From the physical layer up through TCP/IP, covering routing, congestion control, DNS, HTTP and network security fundamentals.', 'Systems', 103, 'Dr. Anjali Rao', 'purple', 3, 'Fall 2026', 'published', 152),
('cs410', 'CS 410', 'Artificial Intelligence', 'Artificial Intelligence', 'Foundations of intelligent agents, search, knowledge representation, reasoning under uncertainty and an introduction to machine learning. Includes hands-on python assignments.', 'Artificial Intelligence', 101, 'Dr. Priya Sharma', 'orange', 4, 'Fall 2026', 'published', 142),
('cs320', 'CS 320', 'Web Technologies', 'Web Technologies', 'Modern client-server web development: HTML5, CSS3, JavaScript, the DOM, async requests, and a guided introduction to back-end services and REST APIs.', 'Programming', NULL, 'Prof. Karthik Nair', 'teal', 3, 'Fall 2026', 'published', 140),
('cs330', 'CS 330', 'Operating Systems', 'Operating Systems', 'Processes, threads, CPU scheduling, memory management, virtual memory, file systems and synchronization. A systems course grounded in C and Linux.', 'Systems', NULL, 'Dr. Sanjay Iyer', 'red', 4, 'Fall 2026', NULL, 190);

-- ---------------- modules (42) ----------------
INSERT INTO modules (id, course_id, title, order_index) VALUES
('cs201-m1', 'cs201', 'Introduction to Data Structures', 1),
('cs201-m2', 'cs201', 'Stacks & Queues', 2),
('cs201-m3', 'cs201', 'Linked Lists', 3),
('cs201-m4', 'cs201', 'Trees', 4),
('cs201-m5', 'cs201', 'Graphs', 5),
('cs201-m6', 'cs201', 'Sorting & Searching', 6),
('cs220-m1', 'cs220', 'Relational Model & ER Diagrams', 1),
('cs220-m2', 'cs220', 'SQL Fundamentals', 2),
('cs220-m3', 'cs220', 'Normalization', 3),
('cs220-m4', 'cs220', 'Indexing & Performance', 4),
('cs220-m5', 'cs220', 'Transactions & Concurrency', 5),
('cs220-m6', 'cs220', 'NoSQL Landscape', 6),
('cs220-m7', 'cs220', 'Final Project & Review', 7),
('cs340-m1', 'cs340', 'Network Models & Layering', 1),
('cs340-m2', 'cs340', 'Physical & Data Link Layers', 2),
('cs340-m3', 'cs340', 'Network Layer & Routing', 3),
('cs340-m4', 'cs340', 'Transport Layer & TCP', 4),
('cs340-m5', 'cs340', 'Application Layer', 5),
('cs340-m6', 'cs340', 'Network Security', 6),
('cs340-m7', 'cs340', 'Wireless & Mobile Networks', 7),
('cs340-m8', 'cs340', 'Final Review', 8),
('cs410-m1', 'cs410', 'Intelligent Agents', 1),
('cs410-m2', 'cs410', 'Problem Solving & Search', 2),
('cs410-m3', 'cs410', 'Knowledge Representation', 3),
('cs410-m4', 'cs410', 'Uncertainty & Probabilistic Reasoning', 4),
('cs410-m5', 'cs410', 'Machine Learning Basics', 5),
('cs410-m6', 'cs410', 'Neural Networks & Deep Learning', 6),
('cs320-m1', 'cs320', 'HTML5 Foundations', 1),
('cs320-m2', 'cs320', 'CSS & Layout', 2),
('cs320-m3', 'cs320', 'JavaScript Essentials', 3),
('cs320-m4', 'cs320', 'Async & Fetch API', 4),
('cs320-m5', 'cs320', 'Back-end & REST', 5),
('cs320-m6', 'cs320', 'Deployment', 6),
('cs320-m7', 'cs320', 'Capstone Project', 7),
('cs330-m1', 'cs330', 'Introduction & OS Structures', 1),
('cs330-m2', 'cs330', 'Processes & Threads', 2),
('cs330-m3', 'cs330', 'CPU Scheduling', 3),
('cs330-m4', 'cs330', 'Synchronization', 4),
('cs330-m5', 'cs330', 'Memory Management', 5),
('cs330-m6', 'cs330', 'Virtual Memory', 6),
('cs330-m7', 'cs330', 'File Systems', 7),
('cs330-m8', 'cs330', 'Final Review', 8);

-- ---------------- lessons (57; content = meta, per db.js) ----------------
INSERT INTO lessons (id, module_id, title, content, type, meta, size_bytes, order_index) VALUES
('cs201-l1', 'cs201-m1', 'Introduction.pdf', 'Course notes · 42 pages', 'pdf', 'Course notes · 42 pages', 2860000, 1),
('cs201-l2', 'cs201-m1', 'Arrays & Complexity.pdf', 'Lecture slides · 38 pages', 'pdf', 'Lecture slides · 38 pages', 1980000, 2),
('cs201-l3', 'cs201-m1', 'Lecture 1 — Big-O Notation', 'Video · 48 min', 'video', 'Video · 48 min', 24000000, 3),
('cs201-l4', 'cs201-m1', 'Practice Questions 1.pdf', 'Problem set · 12 problems', 'pdf', 'Problem set · 12 problems', 900000, 4),
('cs201-l5', 'cs201-m2', 'Stacks & Queues.pdf', 'Lecture slides · 30 pages', 'pdf', 'Lecture slides · 30 pages', 1720000, 5),
('cs201-l6', 'cs201-m2', 'Lecture 2 — Stack Applications', 'Video · 54 min', 'video', 'Video · 54 min', 31000000, 6),
('cs201-l7', 'cs201-m2', 'Visualiser — Stack Animations', 'Interactive resource', 'link', 'Interactive resource', NULL, 7),
('cs201-l8', 'cs201-m3', 'Singly & Doubly Linked Lists.pdf', 'Lecture slides · 44 pages', 'pdf', 'Lecture slides · 44 pages', 2240000, 8),
('cs201-l9', 'cs201-m3', 'Lecture 3 — Linked List Implementations', 'Video · 52 min', 'video', 'Video · 52 min', 28000000, 9),
('cs201-l10', 'cs201-m3', 'Lab Sheet — Linked Lists.pdf', 'Lab worksheet', 'pdf', 'Lab worksheet', 640000, 10),
('cs201-l11', 'cs201-m4', 'Binary Trees & BST.pdf', 'Lecture slides · 50 pages', 'pdf', 'Lecture slides · 50 pages', 2600000, 11),
('cs201-l12', 'cs201-m4', 'Lecture 4 — Tree Traversals', 'Video · 58 min', 'video', 'Video · 58 min', 33000000, 12),
('cs201-l13', 'cs201-m4', 'AVL & Red-Black Trees.pdf', 'Supplementary reading', 'pdf', 'Supplementary reading', 2100000, 13),
('cs201-l14', 'cs201-m5', 'Graph Representations.pdf', 'Lecture slides · 36 pages', 'pdf', 'Lecture slides · 36 pages', 1900000, 14),
('cs201-l15', 'cs201-m5', 'Lecture 5 — BFS & DFS', 'Video · 61 min', 'video', 'Video · 61 min', 36000000, 15),
('cs201-l16', 'cs201-m5', 'Graph Algorithm Playground', 'Interactive resource', 'link', 'Interactive resource', NULL, 16),
('cs201-l17', 'cs201-m6', 'Comparison-based Sorting.pdf', 'Lecture slides · 40 pages', 'pdf', 'Lecture slides · 40 pages', 2100000, 17),
('cs201-l18', 'cs201-m6', 'Lecture 6 — Quicksort & Merge Sort', 'Video · 55 min', 'video', 'Video · 55 min', 29000000, 18),
('cs201-l19', 'cs201-m6', 'Practice Questions 6.pdf', 'Problem set · 15 problems', 'pdf', 'Problem set · 15 problems', 840000, 19),
('cs220-l1', 'cs220-m1', 'ER Modelling.pdf', 'Lecture slides · 46 pages', 'pdf', 'Lecture slides · 46 pages', 2200000, 1),
('cs220-l2', 'cs220-m1', 'Lecture 1 — Relational Model', 'Video · 50 min', 'video', 'Video · 50 min', 25000000, 2),
('cs220-l3', 'cs220-m2', 'SQL Queries.pdf', 'Lecture slides · 52 pages', 'pdf', 'Lecture slides · 52 pages', 2600000, 3),
('cs220-l4', 'cs220-m2', 'Lecture 2 — Joins & Subqueries', 'Video · 56 min', 'video', 'Video · 56 min', 30000000, 4),
('cs220-l5', 'cs220-m3', '2NF, 3NF, BCNF.pdf', 'Lecture slides · 34 pages', 'pdf', 'Lecture slides · 34 pages', 1800000, 5),
('cs220-l6', 'cs220-m3', 'Normalization Exercises.pdf', 'Problem set', 'pdf', 'Problem set', 720000, 6),
('cs220-l7', 'cs220-m4', 'B+ Trees & Indexing.pdf', 'Lecture slides · 40 pages', 'pdf', 'Lecture slides · 40 pages', 2000000, 7),
('cs220-l8', 'cs220-m5', 'Lecture 5 — ACID & Isolation', 'Video · 53 min', 'video', 'Video · 53 min', 27000000, 8),
('cs220-l9', 'cs220-m6', 'Document & Key-Value Stores.pdf', 'Reading material', 'pdf', 'Reading material', 1500000, 9),
('cs220-l10', 'cs220-m7', 'Project Specification.pdf', 'Guidelines', 'pdf', 'Guidelines', 980000, 10),
('cs340-l1', 'cs340-m1', 'OSI & TCP-IP.pdf', 'Lecture slides · 36 pages', 'pdf', 'Lecture slides · 36 pages', 1900000, 1),
('cs340-l2', 'cs340-m1', 'Lecture 1 — Layered Architecture', 'Video · 47 min', 'video', 'Video · 47 min', 23000000, 2),
('cs340-l3', 'cs340-m2', 'Ethernet & MAC.pdf', 'Lecture slides · 42 pages', 'pdf', 'Lecture slides · 42 pages', 2100000, 3),
('cs340-l4', 'cs340-m2', 'Lecture 2 — Framing & Error Control', 'Video · 51 min', 'video', 'Video · 51 min', 26000000, 4),
('cs340-l5', 'cs340-m3', 'IP Addressing & Subnetting.pdf', 'Lecture slides · 46 pages', 'pdf', 'Lecture slides · 46 pages', 2300000, 5),
('cs340-l6', 'cs340-m3', 'Cisco Packet Tracer Lab', 'Lab resource', 'link', 'Lab resource', NULL, 6),
('cs340-l7', 'cs340-m4', 'TCP & Congestion Control.pdf', 'Lecture slides · 48 pages', 'pdf', 'Lecture slides · 48 pages', 2400000, 7),
('cs340-l8', 'cs340-m5', 'HTTP, DNS & SMTP.pdf', 'Lecture slides · 55 pages', 'pdf', 'Lecture slides · 55 pages', 2800000, 8),
('cs340-l9', 'cs340-m6', 'TLS & Firewalls.pdf', 'Lecture slides · 34 pages', 'pdf', 'Lecture slides · 34 pages', 1800000, 9),
('cs410-l1', 'cs410-m1', 'Agents & Environments.pdf', 'Lecture slides · 30 pages', 'pdf', 'Lecture slides · 30 pages', 1600000, 1),
('cs410-l2', 'cs410-m2', 'BFS, DFS, A*.pdf', 'Lecture slides · 50 pages', 'pdf', 'Lecture slides · 50 pages', 2500000, 2),
('cs410-l3', 'cs410-m2', 'Lecture 2 — Heuristic Search', 'Video · 57 min', 'video', 'Video · 57 min', 31000000, 3),
('cs410-l4', 'cs410-m3', 'Logic & Inference.pdf', 'Lecture slides · 38 pages', 'pdf', 'Lecture slides · 38 pages', 1900000, 4),
('cs410-l5', 'cs410-m4', 'Bayesian Networks.pdf', 'Lecture slides · 42 pages', 'pdf', 'Lecture slides · 42 pages', 2000000, 5),
('cs410-l6', 'cs410-m5', 'Supervised Learning.pdf', 'Lecture slides · 55 pages', 'pdf', 'Lecture slides · 55 pages', 2700000, 6),
('cs410-l7', 'cs410-m5', 'Lecture 5 — Linear & Logistic Regression', 'Video · 60 min', 'video', 'Video · 60 min', 34000000, 7),
('cs410-l8', 'cs410-m6', 'TensorFlow Playground', 'Interactive resource', 'link', 'Interactive resource', NULL, 8),
('cs410-l9', 'cs410-m6', 'CNN & RNN Overview.pdf', 'Lecture slides', 'pdf', 'Lecture slides', 2400000, 9),
('cs320-l1', 'cs320-m1', 'Semantic HTML.pdf', 'Lecture slides · 26 pages', 'pdf', 'Lecture slides · 26 pages', 1300000, 1),
('cs320-l2', 'cs320-m1', 'Lecture 1 — Document Structure', 'Video · 42 min', 'video', 'Video · 42 min', 20000000, 2),
('cs320-l3', 'cs320-m2', 'Flexbox & Grid.pdf', 'Lecture slides · 44 pages', 'pdf', 'Lecture slides · 44 pages', 2100000, 3),
('cs320-l4', 'cs320-m3', 'JS Language & DOM.pdf', 'Lecture slides · 52 pages', 'pdf', 'Lecture slides · 52 pages', 2600000, 4),
('cs320-l5', 'cs320-m3', 'Lecture 3 — DOM Manipulation', 'Video · 54 min', 'video', 'Video · 54 min', 28000000, 5),
('cs320-l6', 'cs320-m4', 'Promises & Fetch.pdf', 'Lecture slides · 34 pages', 'pdf', 'Lecture slides · 34 pages', 1800000, 6),
('cs320-l7', 'cs320-m5', 'REST API Design.pdf', 'Lecture slides', 'pdf', 'Lecture slides', 1500000, 7),
('cs330-l1', 'cs330-m1', 'OS Overview.pdf', 'Lecture slides · 34 pages', 'pdf', 'Lecture slides · 34 pages', 1700000, 1),
('cs330-l2', 'cs330-m1', 'Lecture 1 — What is an OS?', 'Video · 45 min', 'video', 'Video · 45 min', 22000000, 2),
('cs330-l3', 'cs330-m2', 'Processes & Scheduling.pdf', 'Lecture slides · 46 pages', 'pdf', 'Lecture slides · 46 pages', 2300000, 3);

-- ---------------- enrollments (24: 201 in all 6 + 202/203/207 heuristic pct) ----------------
INSERT INTO enrollments (student_id, course_id, status, progress_percent, enrolled_at) VALUES
(201, 'cs201', 'active', 68, NOW()), (201, 'cs220', 'active', 42, NOW()), (201, 'cs340', 'active', 25, NOW()),
(201, 'cs410', 'active', 80, NOW()), (201, 'cs320', 'active', 55, NOW()), (201, 'cs330', 'active', 12, NOW()),
(202, 'cs201', 'active', 80, NOW()), (202, 'cs220', 'active', 85, NOW()), (202, 'cs340', 'active', 90, NOW()),
(202, 'cs410', 'active', 95, NOW()), (202, 'cs320', 'active', 96, NOW()), (202, 'cs330', 'active', 84, NOW()),
(203, 'cs201', 'active', 66, NOW()), (203, 'cs220', 'active', 71, NOW()), (203, 'cs340', 'active', 76, NOW()),
(203, 'cs410', 'active', 81, NOW()), (203, 'cs320', 'active', 86, NOW()), (203, 'cs330', 'active', 70, NOW()),
(207, 'cs201', 'active', 71, NOW()), (207, 'cs220', 'active', 76, NOW()), (207, 'cs340', 'active', 81, NOW()),
(207, 'cs410', 'active', 86, NOW()), (207, 'cs320', 'active', 91, NOW()), (207, 'cs330', 'active', 75, NOW());

-- ---------------- lesson_progress (38 rows, student 201, first modulesDone modules) ----------------
INSERT INTO lesson_progress (student_id, lesson_id, completed_at) VALUES
(201, 'cs201-l1', NOW()), (201, 'cs201-l2', NOW()), (201, 'cs201-l3', NOW()), (201, 'cs201-l4', NOW()),
(201, 'cs201-l5', NOW()), (201, 'cs201-l6', NOW()), (201, 'cs201-l7', NOW()), (201, 'cs201-l8', NOW()),
(201, 'cs201-l9', NOW()), (201, 'cs201-l10', NOW()), (201, 'cs201-l11', NOW()), (201, 'cs201-l12', NOW()),
(201, 'cs201-l13', NOW()),
(201, 'cs220-l1', NOW()), (201, 'cs220-l2', NOW()), (201, 'cs220-l3', NOW()),
(201, 'cs220-l4', NOW()), (201, 'cs220-l5', NOW()), (201, 'cs220-l6', NOW()),
(201, 'cs340-l1', NOW()), (201, 'cs340-l2', NOW()), (201, 'cs340-l3', NOW()), (201, 'cs340-l4', NOW()),
(201, 'cs410-l1', NOW()), (201, 'cs410-l2', NOW()), (201, 'cs410-l3', NOW()), (201, 'cs410-l4', NOW()),
(201, 'cs410-l5', NOW()), (201, 'cs410-l6', NOW()), (201, 'cs410-l7', NOW()),
(201, 'cs320-l1', NOW()), (201, 'cs320-l2', NOW()), (201, 'cs320-l3', NOW()),
(201, 'cs320-l4', NOW()), (201, 'cs320-l5', NOW()), (201, 'cs320-l6', NOW()),
(201, 'cs330-l1', NOW()), (201, 'cs330-l2', NOW());

-- ---------------- assignments (a1–a6) ----------------
INSERT INTO assignments (id, course_id, title, max_marks, due_at, status, description) VALUES
('a1', 'cs201', 'Linked List Implementation', 100, DATE_ADD(NOW(), INTERVAL 2 DAY), 'in-progress', 'Implement a doubly linked list in C/C++ supporting insertion, deletion, reversal and cycle detection. Document the complexities of each operation.'),
('a2', 'cs220', 'ER Diagram for Library System', 50, DATE_ADD(NOW(), INTERVAL 4 DAY), 'not-started', 'Design a complete ER diagram for a university library system covering members, catalogue, loans and reservations. Produce a normalized schema.'),
('a3', 'cs340', 'Network Topology Analysis', 20, DATE_SUB(NOW(), INTERVAL 1 DAY), 'submitted', 'Analyse the given campus network topology, identify bottlenecks and propose improvements with justification.'),
('a4', 'cs410', 'Search Algorithms Essay', 30, DATE_SUB(NOW(), INTERVAL 6 DAY), 'graded', 'Write a 1500-word essay comparing uninformed vs informed search with concrete examples.'),
('a5', 'cs320', 'Static Portfolio Site', 50, DATE_SUB(NOW(), INTERVAL 10 DAY), 'graded', 'Build a responsive static portfolio using only HTML and CSS. Must include semantic markup and a media query breakpoint.'),
('a6', 'cs330', 'Process Scheduling Report', 40, DATE_SUB(NOW(), INTERVAL 1 DAY), 'overdue', 'Simulate FCFS, SJF and Round Robin on the provided dataset and report average turnaround and waiting times.');

-- ---------------- submissions (s1–s5 from pendingSubmissions) ----------------
INSERT INTO submissions (id, assignment_id, course_id, student_id, content, file_url, score, feedback, graded_at, status, submitted_at) VALUES
('s1', 'a1', 'cs201', 202, 'Submitted file: meera_linkedlist.pdf', NULL, NULL, NULL, NULL, 'pending', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('s2', 'a1', 'cs201', 203, 'Submitted file: rohan_linkedlist.pdf', NULL, NULL, NULL, NULL, 'pending', DATE_SUB(NOW(), INTERVAL 10 HOUR)),
('s3', 'a3', 'cs340', 202, 'Submitted file: sneha_topology.pdf', NULL, NULL, NULL, NULL, 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('s4', 'a3', 'cs340', 201, 'Submitted file: alex_topology.pdf', NULL, NULL, NULL, NULL, 'reviewing', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('s5', 'a2', 'cs220', 207, 'Submitted file: aditya_er.pdf', NULL, NULL, NULL, NULL, 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- ---------------- grades (g1–g10, student 201) ----------------
INSERT INTO grades (course_id, student_id, assessment, type, score, max_score, graded_at) VALUES
('cs201', 201, 'Assignment 1 — Array Utilities', 'assignment', 84, 100, DATE_SUB(NOW(), INTERVAL 20 DAY)),
('cs201', 201, 'Quiz 1 — Complexity', 'quiz', 9, 10, DATE_SUB(NOW(), INTERVAL 14 DAY)),
('cs201', 201, 'Assignment 2 — Linked List', 'assignment', 87, 100, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('cs220', 201, 'Quiz 1 — SQL Basics', 'quiz', 7, 10, DATE_SUB(NOW(), INTERVAL 12 DAY)),
('cs220', 201, 'Assignment 1 — ER Diagram', 'assignment', 42, 50, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('cs340', 201, 'Quiz 1 — Network Models', 'quiz', 10, 12, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('cs410', 201, 'Assignment 1 — Search Essay', 'assignment', 26, 30, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('cs410', 201, 'Quiz 1 — AI Logic', 'quiz', 9, 10, DATE_SUB(NOW(), INTERVAL 8 DAY)),
('cs320', 201, 'Mid-term Exam', 'exam', 44, 50, DATE_SUB(NOW(), INTERVAL 12 DAY)),
('cs320', 201, 'Assignment 1 — Portfolio', 'assignment', 45, 50, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- ---------------- quizzes (q1–q5) ----------------
INSERT INTO quizzes (id, course_id, title, duration_min, attempts_max, due_at, status) VALUES
('q1', 'cs201', 'Trees & BST', 15, 3, DATE_ADD(NOW(), INTERVAL 5 DAY), 'available'),
('q2', 'cs220', 'SQL Fundamentals', 20, 2, DATE_ADD(NOW(), INTERVAL 8 DAY), 'available'),
('q3', 'cs340', 'Network Models', 15, 2, DATE_SUB(NOW(), INTERVAL 4 DAY), 'completed'),
('q4', 'cs410', 'AI Logic & Reasoning', 10, 3, DATE_SUB(NOW(), INTERVAL 9 DAY), 'completed'),
('q5', 'cs320', 'HTML & Accessibility', 10, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), 'available');

-- ---------------- quiz_questions (42) ----------------
INSERT INTO quiz_questions (quiz_id, position, question, options_json, answer_index) VALUES
('q1', 0, 'What is the worst-case time complexity of searching in an unbalanced binary search tree?', '["O(log n)","O(n)","O(n log n)","O(1)"]', 1),
('q1', 1, 'In a full binary tree with n internal nodes, how many total nodes are there?', '["2n","2n + 1","2n - 1","n + 1"]', 1),
('q1', 2, 'Which traversal visits the left subtree, then the root, then the right subtree?', '["Preorder","Postorder","Inorder","Level-order"]', 2),
('q1', 3, 'The left subtree of a node in a BST contains only nodes with keys...', '["Greater than the node","Less than the node","Equal to the node","Unrelated to the node"]', 1),
('q1', 4, 'What is the height of an empty tree?', '["0","1","-1","Undefined"]', 2),
('q1', 5, 'An AVL tree ensures the height difference between subtrees is at most...', '["0","1","2","3"]', 1),
('q1', 6, 'Which data structure is best suited for implementing a priority queue?', '["Binary search tree","Heap","Stack","Doubly linked list"]', 1),
('q1', 7, 'Deletion in a red-black tree guarantees a black-height that is...', '["Doubled","Balanced","Uniform across all root-to-leaf paths","Zero"]', 2),
('q1', 8, 'A complete binary tree with 7 nodes has how many leaf nodes?', '["3","4","5","6"]', 1),
('q1', 9, 'Which of the following is NOT a tree?', '["Binary tree","B-tree","AVL tree","Cyclic graph"]', 3),
('q2', 0, 'Which SQL clause is used to filter groups after aggregation?', '["WHERE","HAVING","GROUP BY","ORDER BY"]', 1),
('q2', 1, 'The primary key of a table must be...', '["Nullable","Unique and not null","An integer","A foreign key"]', 1),
('q2', 2, 'Which join returns only matching rows from both tables?', '["LEFT JOIN","RIGHT JOIN","INNER JOIN","FULL JOIN"]', 2),
('q2', 3, 'What does SQL stand for?', '["Structured Query Language","Sequential Query Logic","Simple Quality Language","Standard Query Line"]', 0),
('q2', 4, 'A table in 3NF must first satisfy...', '["1NF only","2NF","BCNF","All normal forms"]', 1),
('q2', 5, 'Which of these removes duplicate rows from a query result?', '["DISTINCT","UNIQUE","GROUP BY","HAVING"]', 0),
('q2', 6, 'What type of key references another table''s primary key?', '["Candidate key","Foreign key","Super key","Composite key"]', 1),
('q2', 7, 'The DELETE statement removes...', '["A table","Rows from a table","A database","An index"]', 1),
('q3', 0, 'Which layer of the OSI model is responsible for routing?', '["Data link","Transport","Network","Session"]', 2),
('q3', 1, 'TCP is a...', '["Connectionless protocol","Connection-oriented protocol","Best-effort protocol","Unreliable protocol"]', 1),
('q3', 2, 'IP addresses are assigned at which OSI layer?', '["Physical","Network","Transport","Application"]', 1),
('q3', 3, 'Which protocol resolves domain names to IP addresses?', '["HTTP","FTP","DNS","SMTP"]', 2),
('q3', 4, 'A MAC address is stored at which layer?', '["Network","Transport","Data link","Application"]', 2),
('q3', 5, 'What port does HTTP typically use?', '["21","25","80","443"]', 2),
('q3', 6, 'The subnet mask 255.255.255.0 allows how many hosts per subnet?', '["254","255","256","512"]', 0),
('q3', 7, 'UDP is preferred over TCP when...', '["Reliability matters","Speed and low latency matter","Ordering matters","Congestion control is required"]', 1),
('q3', 8, 'Which device operates at the network layer?', '["Hub","Switch","Router","Bridge"]', 2),
('q3', 9, 'Handshaking in TCP uses how many messages?', '["2","3","4","5"]', 1),
('q4', 0, 'Which search algorithm is complete and optimal when all step costs are identical?', '["DFS","Greedy best-first","BFS","Hill climbing"]', 2),
('q4', 1, 'A* combines...', '["g(n) + h(n)","g(n) - h(n)","h(n) - g(n)","g(n) * h(n)"]', 0),
('q4', 2, 'An admissible heuristic...', '["Overestimates cost","Never overestimates cost","Is always zero","Ignores the goal"]', 1),
('q4', 3, 'The minimax algorithm is used for...', '["Regression","Game playing","Clustering","Text classification"]', 1),
('q4', 4, 'A knowledge base that uses first-order logic primarily expresses...', '["Numbers","Relations between objects","Only binary decisions","Gradients"]', 1),
('q4', 5, 'Machine learning is most directly about...', '["Improving performance with experience","Encoding explicit rules","Indexing databases","Compiling code"]', 0),
('q4', 6, 'In supervised learning, the training data is...', '["Unlabelled","Labelled","Randomised","Synthetic only"]', 1),
('q4', 7, 'Bayes'' theorem is foundational for...', '["Uncertainty reasoning","Deterministic search","Neural architecture search","Lexical parsing"]', 0),
('q5', 0, 'Which HTML element carries semantic meaning for the main content of a page?', '["<div>","<main>","<span>","<section>"]', 1),
('q5', 1, 'What is the purpose of alt text on images?', '["Styling","Accessibility and fallback","Speed","SEO only"]', 1),
('q5', 2, 'Which attribute makes a checkbox group accessible?', '["id","aria-label or associated label","class","value"]', 1),
('q5', 3, 'What does the <nav> element wrap?', '["Headings","Tables","Navigation links","Forms"]', 2),
('q5', 4, 'A button inside a form with type="submit" will...', '["Refresh the page only","Submit the form","Reset the form","Close the tab"]', 1),
('q5', 5, 'Which is the correct document-level heading hierarchy start?', '["<h3> then <h1>","<h2> then <h3>","<h1> then <h2>","Any order"]', 2);

-- ---------------- attendance: 12 history rows as sessions + records (student 201) ----------------
INSERT INTO attendance_sessions (course_id, session_date) VALUES
('cs201', DATE(DATE_SUB(NOW(), INTERVAL 55 DAY))), ('cs201', DATE(DATE_SUB(NOW(), INTERVAL 51 DAY))),
('cs201', DATE(DATE_SUB(NOW(), INTERVAL 44 DAY))), ('cs201', DATE(DATE_SUB(NOW(), INTERVAL 37 DAY))),
('cs201', DATE(DATE_SUB(NOW(), INTERVAL 30 DAY))), ('cs201', DATE(DATE_SUB(NOW(), INTERVAL 23 DAY))),
('cs201', DATE(DATE_SUB(NOW(), INTERVAL 16 DAY))), ('cs201', DATE(DATE_SUB(NOW(), INTERVAL 9 DAY))),
('cs201', DATE(DATE_SUB(NOW(), INTERVAL 2 DAY))),
('cs220', DATE(DATE_SUB(NOW(), INTERVAL 22 DAY))), ('cs220', DATE(DATE_SUB(NOW(), INTERVAL 15 DAY))),
('cs220', DATE(DATE_SUB(NOW(), INTERVAL 8 DAY)));
INSERT INTO attendance_records (session_id, student_id, status)
SELECT id, 201, 'present' FROM attendance_sessions;
UPDATE attendance_records SET status = 'absent' WHERE session_id =
  (SELECT id FROM attendance_sessions WHERE course_id = 'cs201' AND session_date = DATE(DATE_SUB(NOW(), INTERVAL 44 DAY)));
UPDATE attendance_records SET status = 'absent' WHERE session_id =
  (SELECT id FROM attendance_sessions WHERE course_id = 'cs201' AND session_date = DATE(DATE_SUB(NOW(), INTERVAL 16 DAY)));
UPDATE attendance_records SET status = 'absent' WHERE session_id =
  (SELECT id FROM attendance_sessions WHERE course_id = 'cs220' AND session_date = DATE(DATE_SUB(NOW(), INTERVAL 15 DAY)));

-- ---------------- announcements (an1, an2 — cs201, author 101) ----------------
INSERT INTO announcements (id, course_id, author_id, title, body, created_at) VALUES
('an1', 'cs201', 101, 'Welcome to Data Structures & Algorithms', 'Please review the syllabus and complete the prerequisite reading before the first lecture.', DATE_SUB(NOW(), INTERVAL 12 DAY)),
('an2', 'cs201', 101, 'Assignment 2 released', 'Linked List Implementation is now live. Submit before the deadline for full credit.', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ---------------- notifications (n1–n7, user 201) ----------------
INSERT INTO notifications (id, user_id, type, title, message, course_id, is_read, created_at) VALUES
('n1', 201, 'assignment', 'Assignment due in 2 days', CONCAT('“Linked List Implementation” for Data Structures & Algorithms closes on ', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%d %b %Y'), '.'), 'cs201', FALSE, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
('n2', 201, 'quiz', 'New quiz available', '“Trees & BST” is now open for Data Structures & Algorithms. You have 3 attempts.', 'cs201', FALSE, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
('n3', 201, 'grade', 'Grade published', 'Your result for Assignment 2 — Linked List (87/100) is now available.', 'cs201', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('n4', 201, 'course', 'New material uploaded', 'Graph Representations.pdf added to Module 5 — Graphs of Computer Networks.', 'cs340', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('n5', 201, 'assignment', 'Assignment graded', 'Search Algorithms Essay was graded: 26/30 (87%).', 'cs410', TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('n6', 201, 'system', 'System maintenance', 'LearnHub will be offline on Sunday 02:00–04:00 IST for scheduled maintenance.', NULL, TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('n7', 201, 'grade', 'Mid-term results released', 'Mid-term Exam for Web Technologies: 44/50 (88%).', 'cs320', TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY));

-- ---------------- activity_events (admin 6 + faculty 5 feeds) ----------------
INSERT INTO activity_events (actor_id, type, text, detail, created_at) VALUES
(NULL, 'student', 'New student registered', 'Tanvi Desai enrolled in B.Tech IT', DATE_SUB(NOW(), INTERVAL 19 HOUR)),
(NULL, 'faculty', 'Faculty created a course', 'Dr. Priya Sharma published “Graph Algorithms”', DATE_SUB(NOW(), INTERVAL 29 HOUR)),
(NULL, 'assignment', 'Assignment published', '“Trees & BST” quiz set live in CS 201', DATE_SUB(NOW(), INTERVAL 38 HOUR)),
(NULL, 'grade', 'Quiz submitted', '158 quiz submissions processed overnight', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(NULL, 'system', 'Backup completed', 'Nightly database backup succeeded', DATE_SUB(NOW(), INTERVAL 60 HOUR)),
(NULL, 'student', 'Enrollment window opened', 'Spring 2027 course registration now open', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(NULL, 'submission', 'Meera Patel submitted “Linked List Implementation”', 'CS 201', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(NULL, 'quiz', 'Quiz result recorded for 12 students in “Trees & BST”', 'CS 201', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(NULL, 'material', 'Uploaded “Graph Representations.pdf” to Computer Networks', 'CS 340', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(NULL, 'grade', 'Graded 5 submissions for “Search Algorithms Essay”', 'CS 410', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(NULL, 'student', '3 new students enrolled in Data Structures & Algorithms', 'CS 201', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- ---------------- platform_settings (admin baseline) ----------------
INSERT INTO platform_settings (setting_key, value_json) VALUES
('branding', '{"siteName":"LearnHub"}');
