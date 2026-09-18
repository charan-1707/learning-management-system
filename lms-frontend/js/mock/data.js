window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var D = LH.date;

  /* ---------------------------------- Users ---------------------------------- */

  var users = [
    {
      id: 101, name: 'Dr. Priya Sharma', email: 'faculty@learnhub.com', password: 'faculty',
      role: 'faculty', dept: 'Computer Science', title: 'Professor', status: 'active',
      lastActive: D.relativeDays(-0.1), joined: '02 Jun 2015'
    },
    {
      id: 201, name: 'Alex Johnson', email: 'student@learnhub.com', password: 'student',
      role: 'student', dept: 'Computer Science', program: 'B.Tech CSE', year: '3rd Year',
      status: 'active', lastActive: D.relativeDays(-0.2), joined: '12 Aug 2024'
    },
    {
      id: 5, name: 'Rahul Verma', email: 'admin@learnhub.com', password: 'admin',
      role: 'admin', dept: 'Administration', title: 'System Administrator', status: 'active',
      lastActive: D.relativeDays(-0.05), joined: '01 Jan 2019'
    },
    {
      id: 102, name: 'Prof. Rohan Mehta', email: 'rohan.mehta@learnhub.edu', password: 'rohan',
      role: 'faculty', dept: 'Computer Science', title: 'Associate Professor', status: 'active',
      lastActive: D.relativeDays(-0.4), joined: 'Aug 2018'
    },
    {
      id: 103, name: 'Dr. Anjali Rao', email: 'anjali.rao@learnhub.edu', password: 'anjali',
      role: 'faculty', dept: 'Information Technology', title: 'Professor', status: 'active',
      lastActive: D.relativeDays(-0.6), joined: 'Jan 2019'
    },
    {
      id: 202, name: 'Meera Patel', email: 'meera.p@learnhub.edu', password: 'meera',
      role: 'student', dept: 'Computer Science', program: 'B.Tech CSE', year: '3rd Year',
      status: 'active', lastActive: D.relativeDays(-0.3), joined: 'Aug 2024'
    },
    {
      id: 203, name: 'Rohan Gupta', email: 'rohan.g@learnhub.edu', password: 'rohan',
      role: 'student', dept: 'Information Technology', program: 'B.Tech IT', year: '2nd Year',
      status: 'active', lastActive: D.relativeDays(-1), joined: 'Aug 2025'
    },
    {
      id: 207, name: 'Aditya Kumar', email: 'aditya.k@learnhub.edu', password: 'aditya',
      role: 'student', dept: 'Information Technology', program: 'B.Tech IT', year: '3rd Year',
      status: 'active', lastActive: D.relativeDays(-0.8), joined: 'Aug 2024'
    }
  ];

  var facultyList = [
    { id: 101, name: 'Dr. Priya Sharma', email: 'priya.sharma@learnhub.edu', dept: 'Computer Science', title: 'Professor', coursesTaught: 3, students: 214, status: 'active', joined: 'Jun 2015' },
    { id: 102, name: 'Prof. Rohan Mehta', email: 'rohan.mehta@learnhub.edu', dept: 'Computer Science', title: 'Associate Professor', coursesTaught: 2, students: 178, status: 'active', joined: 'Aug 2018' },
    { id: 103, name: 'Dr. Anjali Rao', email: 'anjali.rao@learnhub.edu', dept: 'Information Technology', title: 'Professor', coursesTaught: 2, students: 152, status: 'active', joined: 'Jan 2019' },
    { id: 104, name: 'Prof. Karthik Nair', email: 'karthik.nair@learnhub.edu', dept: 'Computer Science', title: 'Assistant Professor', coursesTaught: 2, students: 140, status: 'active', joined: 'Jul 2020' },
    { id: 105, name: 'Dr. Sanjay Iyer', email: 'sanjay.iyer@learnhub.edu', dept: 'Computer Science', title: 'Professor', coursesTaught: 2, students: 190, status: 'on-leave', joined: 'Jan 2012' }
  ];

  var studentList = [
    { id: 201, name: 'Alex Johnson', email: 'alex.j@learnhub.edu', program: 'B.Tech CSE', year: '3', courses: 6, attendance: '81%', gpa: '8.6', status: 'active', joined: 'Aug 2024' },
    { id: 202, name: 'Meera Patel', email: 'meera.p@learnhub.edu', program: 'B.Tech CSE', year: '3', courses: 5, attendance: '88%', gpa: '9.1', status: 'active', joined: 'Aug 2024' },
    { id: 203, name: 'Rohan Gupta', email: 'rohan.g@learnhub.edu', program: 'B.Tech IT', year: '3', courses: 5, attendance: '74%', gpa: '7.8', status: 'active', joined: 'Aug 2024' },
    { id: 204, name: 'Sneha Reddy', email: 'sneha.r@learnhub.edu', program: 'B.Tech CSE', year: '2', courses: 5, attendance: '92%', gpa: '9.3', status: 'active', joined: 'Aug 2025' },
    { id: 205, name: 'Karan Singh', email: 'karan.s@learnhub.edu', program: 'B.Tech CSE', year: '3', courses: 6, attendance: '67%', gpa: '7.2', status: 'warning', joined: 'Aug 2024' },
    { id: 206, name: 'Ishita Bose', email: 'ishita.b@learnhub.edu', program: 'B.Tech CSE', year: '2', courses: 4, attendance: '85%', gpa: '8.9', status: 'active', joined: 'Aug 2025' },
    { id: 207, name: 'Aditya Kumar', email: 'aditya.k@learnhub.edu', program: 'B.Tech IT', year: '3', courses: 5, attendance: '79%', gpa: '8.1', status: 'active', joined: 'Aug 2024' },
    { id: 208, name: 'Nidhi Sharma', email: 'nidhi.s@learnhub.edu', program: 'B.Tech CSE', year: '4', courses: 4, attendance: '90%', gpa: '8.8', status: 'active', joined: 'Aug 2023' },
    { id: 209, name: 'Vivek Joshi', email: 'vivek.j@learnhub.edu', program: 'B.Tech CSE', year: '3', courses: 6, attendance: '71%', gpa: '7.5', status: 'suspended', joined: 'Aug 2024' },
    { id: 210, name: 'Tanvi Desai', email: 'tanvi.d@learnhub.edu', program: 'B.Tech IT', year: '2', courses: 4, attendance: '87%', gpa: '8.4', status: 'active', joined: 'Aug 2025' }
  ];

  /* ---------------------------------- Courses ---------------------------------- */

  var courses = [
    {
      id: 'cs201',
      code: 'CS 201',
      name: 'Data Structures & Algorithms',
      short: 'Data Structures & Algorithms',
      instructor: 'Dr. Priya Sharma',
      instructorId: 101,
      accent: 'blue',
      category: 'Programming',
      progress: 68,
      modulesDone: 4,
      modulesTotal: 6,
      students: 156,
      credits: 4,
      semester: 'Fall 2026',
      description: 'A rigorous introduction to fundamental data structures — arrays, linked lists, stacks, queues, trees, heaps and graphs — along with the core algorithms that operate on them. Emphasis is on asymptotic analysis, correctness and practical implementation.',
      updated: '2 days ago',
      modules: [
        {
          num: 1, title: 'Introduction to Data Structures', completed: true,
          materials: [
            { type: 'pdf', name: 'Introduction.pdf', size: 2860000, meta: 'Course notes · 42 pages' },
            { type: 'pdf', name: 'Arrays & Complexity.pdf', size: 1980000, meta: 'Lecture slides · 38 pages' },
            { type: 'video', name: 'Lecture 1 — Big-O Notation', size: 24000000, meta: 'Video · 48 min' },
            { type: 'pdf', name: 'Practice Questions 1.pdf', size: 900000, meta: 'Problem set · 12 problems' }
          ]
        },
        {
          num: 2, title: 'Stacks & Queues', completed: true,
          materials: [
            { type: 'pdf', name: 'Stacks & Queues.pdf', size: 1720000, meta: 'Lecture slides · 30 pages' },
            { type: 'video', name: 'Lecture 2 — Stack Applications', size: 31000000, meta: 'Video · 54 min' },
            { type: 'link', name: 'Visualiser — Stack Animations', meta: 'Interactive resource' }
          ]
        },
        {
          num: 3, title: 'Linked Lists', completed: true,
          materials: [
            { type: 'pdf', name: 'Singly & Doubly Linked Lists.pdf', size: 2240000, meta: 'Lecture slides · 44 pages' },
            { type: 'video', name: 'Lecture 3 — Linked List Implementations', size: 28000000, meta: 'Video · 52 min' },
            { type: 'pdf', name: 'Lab Sheet — Linked Lists.pdf', size: 640000, meta: 'Lab worksheet' }
          ]
        },
        {
          num: 4, title: 'Trees', completed: true,
          materials: [
            { type: 'pdf', name: 'Binary Trees & BST.pdf', size: 2600000, meta: 'Lecture slides · 50 pages' },
            { type: 'video', name: 'Lecture 4 — Tree Traversals', size: 33000000, meta: 'Video · 58 min' },
            { type: 'pdf', name: 'AVL & Red-Black Trees.pdf', size: 2100000, meta: 'Supplementary reading' }
          ]
        },
        {
          num: 5, title: 'Graphs', completed: false,
          materials: [
            { type: 'pdf', name: 'Graph Representations.pdf', size: 1900000, meta: 'Lecture slides · 36 pages' },
            { type: 'video', name: 'Lecture 5 — BFS & DFS', size: 36000000, meta: 'Video · 61 min' },
            { type: 'link', name: 'Graph Algorithm Playground', meta: 'Interactive resource' }
          ]
        },
        {
          num: 6, title: 'Sorting & Searching', completed: false,
          materials: [
            { type: 'pdf', name: 'Comparison-based Sorting.pdf', size: 2100000, meta: 'Lecture slides · 40 pages' },
            { type: 'video', name: 'Lecture 6 — Quicksort & Merge Sort', size: 29000000, meta: 'Video · 55 min' },
            { type: 'pdf', name: 'Practice Questions 6.pdf', size: 840000, meta: 'Problem set · 15 problems' }
          ]
        }
      ]
    },
    {
      id: 'cs220',
      code: 'CS 220',
      name: 'Database Management Systems',
      short: 'Database Management Systems',
      instructor: 'Prof. Rohan Mehta',
      instructorId: 102,
      accent: 'green',
      category: 'Data',
      progress: 42,
      modulesDone: 3,
      modulesTotal: 7,
      students: 178,
      credits: 4,
      semester: 'Fall 2026',
      description: 'Design, implement and query relational databases. Covers the relational model, SQL, normalization, indexing, transactions and database design with a strong practical component using MySQL.',
      updated: '5 hours ago',
      modules: [
        { num: 1, title: 'Relational Model & ER Diagrams', completed: true, materials: [
          { type: 'pdf', name: 'ER Modelling.pdf', size: 2200000, meta: 'Lecture slides · 46 pages' },
          { type: 'video', name: 'Lecture 1 — Relational Model', size: 25000000, meta: 'Video · 50 min' }
        ] },
        { num: 2, title: 'SQL Fundamentals', completed: true, materials: [
          { type: 'pdf', name: 'SQL Queries.pdf', size: 2600000, meta: 'Lecture slides · 52 pages' },
          { type: 'video', name: 'Lecture 2 — Joins & Subqueries', size: 30000000, meta: 'Video · 56 min' }
        ] },
        { num: 3, title: 'Normalization', completed: true, materials: [
          { type: 'pdf', name: '2NF, 3NF, BCNF.pdf', size: 1800000, meta: 'Lecture slides · 34 pages' },
          { type: 'pdf', name: 'Normalization Exercises.pdf', size: 720000, meta: 'Problem set' }
        ] },
        { num: 4, title: 'Indexing & Performance', completed: false, materials: [
          { type: 'pdf', name: 'B+ Trees & Indexing.pdf', size: 2000000, meta: 'Lecture slides · 40 pages' }
        ] },
        { num: 5, title: 'Transactions & Concurrency', completed: false, materials: [
          { type: 'video', name: 'Lecture 5 — ACID & Isolation', size: 27000000, meta: 'Video · 53 min' }
        ] },
        { num: 6, title: 'NoSQL Landscape', completed: false, materials: [
          { type: 'pdf', name: 'Document & Key-Value Stores.pdf', size: 1500000, meta: 'Reading material' }
        ] },
        { num: 7, title: 'Final Project & Review', completed: false, materials: [
          { type: 'pdf', name: 'Project Specification.pdf', size: 980000, meta: 'Guidelines' }
        ] }
      ]
    },
    {
      id: 'cs340',
      code: 'CS 340',
      name: 'Computer Networks',
      short: 'Computer Networks',
      instructor: 'Dr. Anjali Rao',
      instructorId: 103,
      accent: 'purple',
      category: 'Systems',
      progress: 25,
      modulesDone: 2,
      modulesTotal: 8,
      students: 152,
      credits: 3,
      semester: 'Fall 2026',
      description: 'Understand the layered architecture of modern networks. From the physical layer up through TCP/IP, covering routing, congestion control, DNS, HTTP and network security fundamentals.',
      updated: '1 week ago',
      modules: [
        { num: 1, title: 'Network Models & Layering', completed: true, materials: [
          { type: 'pdf', name: 'OSI & TCP-IP.pdf', size: 1900000, meta: 'Lecture slides · 36 pages' },
          { type: 'video', name: 'Lecture 1 — Layered Architecture', size: 23000000, meta: 'Video · 47 min' }
        ] },
        { num: 2, title: 'Physical & Data Link Layers', completed: true, materials: [
          { type: 'pdf', name: 'Ethernet & MAC.pdf', size: 2100000, meta: 'Lecture slides · 42 pages' },
          { type: 'video', name: 'Lecture 2 — Framing & Error Control', size: 26000000, meta: 'Video · 51 min' }
        ] },
        { num: 3, title: 'Network Layer & Routing', completed: false, materials: [
          { type: 'pdf', name: 'IP Addressing & Subnetting.pdf', size: 2300000, meta: 'Lecture slides · 46 pages' },
          { type: 'link', name: 'Cisco Packet Tracer Lab', meta: 'Lab resource' }
        ] },
        { num: 4, title: 'Transport Layer & TCP', completed: false, materials: [
          { type: 'pdf', name: 'TCP & Congestion Control.pdf', size: 2400000, meta: 'Lecture slides · 48 pages' }
        ] },
        { num: 5, title: 'Application Layer', completed: false, materials: [
          { type: 'pdf', name: 'HTTP, DNS & SMTP.pdf', size: 2800000, meta: 'Lecture slides · 55 pages' }
        ] },
        { num: 6, title: 'Network Security', completed: false, materials: [
          { type: 'pdf', name: 'TLS & Firewalls.pdf', size: 1800000, meta: 'Lecture slides · 34 pages' }
        ] },
        { num: 7, title: 'Wireless & Mobile Networks', completed: false, materials: [] },
        { num: 8, title: 'Final Review', completed: false, materials: [] }
      ]
    },
    {
      id: 'cs410',
      code: 'CS 410',
      name: 'Artificial Intelligence',
      short: 'Artificial Intelligence',
      instructor: 'Dr. Priya Sharma',
      instructorId: 101,
      accent: 'orange',
      category: 'Artificial Intelligence',
      progress: 80,
      modulesDone: 5,
      modulesTotal: 6,
      students: 142,
      credits: 4,
      semester: 'Fall 2026',
      description: 'Foundations of intelligent agents, search, knowledge representation, reasoning under uncertainty and an introduction to machine learning. Includes hands-on python assignments.',
      updated: '3 days ago',
      modules: [
        { num: 1, title: 'Intelligent Agents', completed: true, materials: [
          { type: 'pdf', name: 'Agents & Environments.pdf', size: 1600000, meta: 'Lecture slides · 30 pages' }
        ] },
        { num: 2, title: 'Problem Solving & Search', completed: true, materials: [
          { type: 'pdf', name: 'BFS, DFS, A*.pdf', size: 2500000, meta: 'Lecture slides · 50 pages' },
          { type: 'video', name: 'Lecture 2 — Heuristic Search', size: 31000000, meta: 'Video · 57 min' }
        ] },
        { num: 3, title: 'Knowledge Representation', completed: true, materials: [
          { type: 'pdf', name: 'Logic & Inference.pdf', size: 1900000, meta: 'Lecture slides · 38 pages' }
        ] },
        { num: 4, title: 'Uncertainty & Probabilistic Reasoning', completed: true, materials: [
          { type: 'pdf', name: 'Bayesian Networks.pdf', size: 2000000, meta: 'Lecture slides · 42 pages' }
        ] },
        { num: 5, title: 'Machine Learning Basics', completed: true, materials: [
          { type: 'pdf', name: 'Supervised Learning.pdf', size: 2700000, meta: 'Lecture slides · 55 pages' },
          { type: 'video', name: 'Lecture 5 — Linear & Logistic Regression', size: 34000000, meta: 'Video · 60 min' }
        ] },
        { num: 6, title: 'Neural Networks & Deep Learning', completed: false, materials: [
          { type: 'link', name: 'TensorFlow Playground', meta: 'Interactive resource' },
          { type: 'pdf', name: 'CNN & RNN Overview.pdf', size: 2400000, meta: 'Lecture slides' }
        ] }
      ]
    },
    {
      id: 'cs320',
      code: 'CS 320',
      name: 'Web Technologies',
      short: 'Web Technologies',
      instructor: 'Prof. Karthik Nair',
      instructorId: 104,
      accent: 'teal',
      category: 'Programming',
      progress: 55,
      modulesDone: 4,
      modulesTotal: 7,
      students: 140,
      credits: 3,
      semester: 'Fall 2026',
      description: 'Modern client-server web development: HTML5, CSS3, JavaScript, the DOM, async requests, and a guided introduction to back-end services and REST APIs.',
      updated: '12 hours ago',
      modules: [
        { num: 1, title: 'HTML5 Foundations', completed: true, materials: [
          { type: 'pdf', name: 'Semantic HTML.pdf', size: 1300000, meta: 'Lecture slides · 26 pages' },
          { type: 'video', name: 'Lecture 1 — Document Structure', size: 20000000, meta: 'Video · 42 min' }
        ] },
        { num: 2, title: 'CSS & Layout', completed: true, materials: [
          { type: 'pdf', name: 'Flexbox & Grid.pdf', size: 2100000, meta: 'Lecture slides · 44 pages' }
        ] },
        { num: 3, title: 'JavaScript Essentials', completed: true, materials: [
          { type: 'pdf', name: 'JS Language & DOM.pdf', size: 2600000, meta: 'Lecture slides · 52 pages' },
          { type: 'video', name: 'Lecture 3 — DOM Manipulation', size: 28000000, meta: 'Video · 54 min' }
        ] },
        { num: 4, title: 'Async & Fetch API', completed: true, materials: [
          { type: 'pdf', name: 'Promises & Fetch.pdf', size: 1800000, meta: 'Lecture slides · 34 pages' }
        ] },
        { num: 5, title: 'Back-end & REST', completed: false, materials: [
          { type: 'pdf', name: 'REST API Design.pdf', size: 1500000, meta: 'Lecture slides' }
        ] },
        { num: 6, title: 'Deployment', completed: false, materials: [] },
        { num: 7, title: 'Capstone Project', completed: false, materials: [] }
      ]
    },
    {
      id: 'cs330',
      code: 'CS 330',
      name: 'Operating Systems',
      short: 'Operating Systems',
      instructor: 'Dr. Sanjay Iyer',
      instructorId: 105,
      accent: 'red',
      category: 'Systems',
      progress: 12,
      modulesDone: 1,
      modulesTotal: 8,
      students: 190,
      credits: 4,
      semester: 'Fall 2026',
      description: 'Processes, threads, CPU scheduling, memory management, virtual memory, file systems and synchronization. A systems course grounded in C and Linux.',
      updated: '4 days ago',
      modules: [
        { num: 1, title: 'Introduction & OS Structures', completed: true, materials: [
          { type: 'pdf', name: 'OS Overview.pdf', size: 1700000, meta: 'Lecture slides · 34 pages' },
          { type: 'video', name: 'Lecture 1 — What is an OS?', size: 22000000, meta: 'Video · 45 min' }
        ] },
        { num: 2, title: 'Processes & Threads', completed: false, materials: [
          { type: 'pdf', name: 'Processes & Scheduling.pdf', size: 2300000, meta: 'Lecture slides · 46 pages' }
        ] },
        { num: 3, title: 'CPU Scheduling', completed: false, materials: [] },
        { num: 4, title: 'Synchronization', completed: false, materials: [] },
        { num: 5, title: 'Memory Management', completed: false, materials: [] },
        { num: 6, title: 'Virtual Memory', completed: false, materials: [] },
        { num: 7, title: 'File Systems', completed: false, materials: [] },
        { num: 8, title: 'Final Review', completed: false, materials: [] }
      ]
    }
  ];

  /* ---------------------------------- Assignments ---------------------------------- */

  var assignments = [
    { id: 'a1', title: 'Linked List Implementation', courseId: 'cs201', course: 'Data Structures & Algorithms', maxMarks: 100, due: D.relativeDays(2), status: 'in-progress', submitted: false, graded: false, score: null, grade: null, gradedDate: null, submittedDate: null, description: 'Implement a doubly linked list in C/C++ supporting insertion, deletion, reversal and cycle detection. Document the complexities of each operation.', attachments: [{ name: 'Assignment 2.pdf', size: 1200000, type: 'pdf' }] },
    { id: 'a2', title: 'ER Diagram for Library System', courseId: 'cs220', course: 'Database Management Systems', maxMarks: 50, due: D.relativeDays(4), status: 'not-started', submitted: false, graded: false, score: null, grade: null, gradedDate: null, submittedDate: null, description: 'Design a complete ER diagram for a university library system covering members, catalogue, loans and reservations. Produce a normalized schema.', attachments: [{ name: 'Assignment 1.pdf', size: 980000, type: 'pdf' }] },
    { id: 'a3', title: 'Network Topology Analysis', courseId: 'cs340', course: 'Computer Networks', maxMarks: 20, due: D.relativeDays(-1), status: 'submitted', submitted: true, graded: false, score: null, grade: null, gradedDate: null, submittedDate: D.relativeDays(-2), description: 'Analyse the given campus network topology, identify bottlenecks and propose improvements with justification.', attachments: [{ name: 'Assignment 1.pdf', size: 1500000, type: 'pdf' }] },
    { id: 'a4', title: 'Search Algorithms Essay', courseId: 'cs410', course: 'Artificial Intelligence', maxMarks: 30, due: D.relativeDays(-6), status: 'graded', submitted: true, graded: true, score: 26, grade: '87%', gradedDate: D.relativeDays(-3), submittedDate: D.relativeDays(-7), description: 'Write a 1500-word essay comparing uninformed vs informed search with concrete examples.', attachments: [{ name: 'Essay Topic.pdf', size: 860000, type: 'pdf' }] },
    { id: 'a5', title: 'Static Portfolio Site', courseId: 'cs320', course: 'Web Technologies', maxMarks: 50, due: D.relativeDays(-10), status: 'graded', submitted: true, graded: true, score: 45, grade: '90%', gradedDate: D.relativeDays(-5), submittedDate: D.relativeDays(-9), description: 'Build a responsive static portfolio using only HTML and CSS. Must include semantic markup and a media query breakpoint.', attachments: [{ name: 'Assignment 2.pdf', size: 620000, type: 'pdf' }] },
    { id: 'a6', title: 'Process Scheduling Report', courseId: 'cs330', course: 'Operating Systems', maxMarks: 40, due: D.relativeDays(-1), status: 'overdue', submitted: false, graded: false, score: null, grade: null, gradedDate: null, submittedDate: null, description: 'Simulate FCFS, SJF and Round Robin on the provided dataset and report average turnaround and waiting times.', attachments: [{ name: 'Assignment 1.pdf', size: 1100000, type: 'pdf' }] }
  ];

  /* ---------------------------------- Quizzes ---------------------------------- */

  var quizzes = [
    { id: 'q1', title: 'Trees & BST', courseId: 'cs201', course: 'Data Structures & Algorithms', questions: 10, duration: 15, attemptsMax: 3, attempts: 1, bestScore: '8/10', status: 'available', due: D.relativeDays(5), taken: false },
    { id: 'q2', title: 'SQL Fundamentals', courseId: 'cs220', course: 'Database Management Systems', questions: 8, duration: 20, attemptsMax: 2, attempts: 0, bestScore: null, status: 'available', due: D.relativeDays(8), taken: false },
    { id: 'q3', title: 'Network Models', courseId: 'cs340', course: 'Computer Networks', questions: 12, duration: 15, attemptsMax: 2, attempts: 1, bestScore: '10/12', status: 'completed', due: D.relativeDays(-4), taken: true },
    { id: 'q4', title: 'AI Logic & Reasoning', courseId: 'cs410', course: 'Artificial Intelligence', questions: 10, duration: 10, attemptsMax: 3, attempts: 2, bestScore: '9/10', status: 'completed', due: D.relativeDays(-9), taken: true },
    { id: 'q5', title: 'HTML & Accessibility', courseId: 'cs320', course: 'Web Technologies', questions: 6, duration: 10, attemptsMax: 3, attempts: 0, bestScore: null, status: 'available', due: D.relativeDays(2), taken: false }
  ];

  var quizQuestions = {
    q1: [
      { q: 'What is the worst-case time complexity of searching in an unbalanced binary search tree?', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], answer: 1 },
      { q: 'In a full binary tree with n internal nodes, how many total nodes are there?', options: ['2n', '2n + 1', '2n - 1', 'n + 1'], answer: 1 },
      { q: 'Which traversal visits the left subtree, then the root, then the right subtree?', options: ['Preorder', 'Postorder', 'Inorder', 'Level-order'], answer: 2 },
      { q: 'The left subtree of a node in a BST contains only nodes with keys...', options: ['Greater than the node', 'Less than the node', 'Equal to the node', 'Unrelated to the node'], answer: 1 },
      { q: 'What is the height of an empty tree?', options: ['0', '1', '-1', 'Undefined'], answer: 2 },
      { q: 'An AVL tree ensures the height difference between subtrees is at most...', options: ['0', '1', '2', '3'], answer: 1 },
      { q: 'Which data structure is best suited for implementing a priority queue?', options: ['Binary search tree', 'Heap', 'Stack', 'Doubly linked list'], answer: 1 },
      { q: 'Deletion in a red-black tree guarantees a black-height that is...', options: ['Doubled', 'Balanced', 'Uniform across all root-to-leaf paths', 'Zero'], answer: 2 },
      { q: 'A complete binary tree with 7 nodes has how many leaf nodes?', options: ['3', '4', '5', '6'], answer: 1 },
      { q: 'Which of the following is NOT a tree?', options: ['Binary tree', 'B-tree', 'AVL tree', 'Cyclic graph'], answer: 3 }
    ],
    q2: [
      { q: 'Which SQL clause is used to filter groups after aggregation?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], answer: 1 },
      { q: 'The primary key of a table must be...', options: ['Nullable', 'Unique and not null', 'An integer', 'A foreign key'], answer: 1 },
      { q: 'Which join returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], answer: 2 },
      { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Sequential Query Logic', 'Simple Quality Language', 'Standard Query Line'], answer: 0 },
      { q: 'A table in 3NF must first satisfy...', options: ['1NF only', '2NF', 'BCNF', 'All normal forms'], answer: 1 },
      { q: 'Which of these removes duplicate rows from a query result?', options: ['DISTINCT', 'UNIQUE', 'GROUP BY', 'HAVING'], answer: 0 },
      { q: 'What type of key references another table\'s primary key?', options: ['Candidate key', 'Foreign key', 'Super key', 'Composite key'], answer: 1 },
      { q: 'The DELETE statement removes...', options: ['A table', 'Rows from a table', 'A database', 'An index'], answer: 1 }
    ],
    q3: [
      { q: 'Which layer of the OSI model is responsible for routing?', options: ['Data link', 'Transport', 'Network', 'Session'], answer: 2 },
      { q: 'TCP is a...', options: ['Connectionless protocol', 'Connection-oriented protocol', 'Best-effort protocol', 'Unreliable protocol'], answer: 1 },
      { q: 'IP addresses are assigned at which OSI layer?', options: ['Physical', 'Network', 'Transport', 'Application'], answer: 1 },
      { q: 'Which protocol resolves domain names to IP addresses?', options: ['HTTP', 'FTP', 'DNS', 'SMTP'], answer: 2 },
      { q: 'A MAC address is stored at which layer?', options: ['Network', 'Transport', 'Data link', 'Application'], answer: 2 },
      { q: 'What port does HTTP typically use?', options: ['21', '25', '80', '443'], answer: 2 },
      { q: 'The subnet mask 255.255.255.0 allows how many hosts per subnet?', options: ['254', '255', '256', '512'], answer: 0 },
      { q: 'UDP is preferred over TCP when...', options: ['Reliability matters', 'Speed and low latency matter', 'Ordering matters', 'Congestion control is required'], answer: 1 },
      { q: 'Which device operates at the network layer?', options: ['Hub', 'Switch', 'Router', 'Bridge'], answer: 2 },
      { q: 'Handshaking in TCP uses how many messages?', options: ['2', '3', '4', '5'], answer: 1 }
    ],
    q4: [
      { q: 'Which search algorithm is complete and optimal when all step costs are identical?', options: ['DFS', 'Greedy best-first', 'BFS', 'Hill climbing'], answer: 2 },
      { q: 'A* combines...', options: ['g(n) + h(n)', 'g(n) - h(n)', 'h(n) - g(n)', 'g(n) * h(n)'], answer: 0 },
      { q: 'An admissible heuristic...', options: ['Overestimates cost', 'Never overestimates cost', 'Is always zero', 'Ignores the goal'], answer: 1 },
      { q: 'The minimax algorithm is used for...', options: ['Regression', 'Game playing', 'Clustering', 'Text classification'], answer: 1 },
      { q: 'A knowledge base that uses first-order logic primarily expresses...', options: ['Numbers', 'Relations between objects', 'Only binary decisions', 'Gradients'], answer: 1 },
      { q: 'Machine learning is most directly about...', options: ['Improving performance with experience', 'Encoding explicit rules', 'Indexing databases', 'Compiling code'], answer: 0 },
      { q: 'In supervised learning, the training data is...', options: ['Unlabelled', 'Labelled', 'Randomised', 'Synthetic only'], answer: 1 },
      { q: 'Bayes\' theorem is foundational for...', options: ['Uncertainty reasoning', 'Deterministic search', 'Neural architecture search', 'Lexical parsing'], answer: 0 }
    ],
    q5: [
      { q: 'Which HTML element carries semantic meaning for the main content of a page?', options: ['<div>', '<main>', '<span>', '<section>'], answer: 1 },
      { q: 'What is the purpose of alt text on images?', options: ['Styling', 'Accessibility and fallback', 'Speed', 'SEO only'], answer: 1 },
      { q: 'Which attribute makes a checkbox group accessible?', options: ['id', 'aria-label or associated label', 'class', 'value'], answer: 1 },
      { q: 'What does the <nav> element wrap?', options: ['Headings', 'Tables', 'Navigation links', 'Forms'], answer: 2 },
      { q: 'A button inside a form with type="submit" will...', options: ['Refresh the page only', 'Submit the form', 'Reset the form', 'Close the tab'], answer: 1 },
      { q: 'Which is the correct document-level heading hierarchy start?', options: ['<h3> then <h1>', '<h2> then <h3>', '<h1> then <h2>', 'Any order'], answer: 2 }
    ]
  };

  /* ---------------------------------- Grades ---------------------------------- */

  var grades = [
    { id: 'g1', courseId: 'cs201', course: 'Data Structures & Algorithms', assessment: 'Assignment 1 — Array Utilities', type: 'assignment', score: 84, max: 100, date: D.relativeDays(-20) },
    { id: 'g2', courseId: 'cs201', course: 'Data Structures & Algorithms', assessment: 'Quiz 1 — Complexity', type: 'quiz', score: 9, max: 10, date: D.relativeDays(-14) },
    { id: 'g3', courseId: 'cs201', course: 'Data Structures & Algorithms', assessment: 'Assignment 2 — Linked List', type: 'assignment', score: 87, max: 100, date: D.relativeDays(-2) },
    { id: 'g4', courseId: 'cs220', course: 'Database Management Systems', assessment: 'Quiz 1 — SQL Basics', type: 'quiz', score: 7, max: 10, date: D.relativeDays(-12) },
    { id: 'g5', courseId: 'cs220', course: 'Database Management Systems', assessment: 'Assignment 1 — ER Diagram', type: 'assignment', score: 42, max: 50, date: D.relativeDays(-3) },
    { id: 'g6', courseId: 'cs340', course: 'Computer Networks', assessment: 'Quiz 1 — Network Models', type: 'quiz', score: 10, max: 12, date: D.relativeDays(-4) },
    { id: 'g7', courseId: 'cs410', course: 'Artificial Intelligence', assessment: 'Assignment 1 — Search Essay', type: 'assignment', score: 26, max: 30, date: D.relativeDays(-3) },
    { id: 'g8', courseId: 'cs410', course: 'Artificial Intelligence', assessment: 'Quiz 1 — AI Logic', type: 'quiz', score: 9, max: 10, date: D.relativeDays(-8) },
    { id: 'g9', courseId: 'cs320', course: 'Web Technologies', assessment: 'Mid-term Exam', type: 'exam', score: 44, max: 50, date: D.relativeDays(-12) },
    { id: 'g10', courseId: 'cs320', course: 'Web Technologies', assessment: 'Assignment 1 — Portfolio', type: 'assignment', score: 45, max: 50, date: D.relativeDays(-5) }
  ];

  /* ---------------------------------- Attendance ---------------------------------- */

  var attendance = [
    { courseId: 'cs201', course: 'Data Structures & Algorithms', present: 46, total: 50 },
    { courseId: 'cs220', course: 'Database Management Systems', present: 38, total: 45 },
    { courseId: 'cs340', course: 'Computer Networks', present: 31, total: 40 },
    { courseId: 'cs410', course: 'Artificial Intelligence', present: 48, total: 50 },
    { courseId: 'cs320', course: 'Web Technologies', present: 33, total: 38 },
    { courseId: 'cs330', course: 'Operating Systems', present: 21, total: 30 }
  ];

  var attendanceHistory = [
    { week: 'Week 1', course: 'CS 201', status: 'present', date: D.relativeDays(-55) },
    { week: 'Week 2', course: 'CS 201', status: 'present', date: D.relativeDays(-51) },
    { week: 'Week 3', course: 'CS 201', status: 'absent', date: D.relativeDays(-44) },
    { week: 'Week 4', course: 'CS 201', status: 'present', date: D.relativeDays(-37) },
    { week: 'Week 5', course: 'CS 201', status: 'present', date: D.relativeDays(-30) },
    { week: 'Week 6', course: 'CS 201', status: 'present', date: D.relativeDays(-23) },
    { week: 'Week 7', course: 'CS 201', status: 'absent', date: D.relativeDays(-16) },
    { week: 'Week 8', course: 'CS 201', status: 'present', date: D.relativeDays(-9) },
    { week: 'Week 9', course: 'CS 201', status: 'present', date: D.relativeDays(-2) },
    { week: 'Week 8', course: 'CS 220', status: 'present', date: D.relativeDays(-8) },
    { week: 'Week 7', course: 'CS 220', status: 'absent', date: D.relativeDays(-15) },
    { week: 'Week 6', course: 'CS 220', status: 'present', date: D.relativeDays(-22) }
  ];

  /* ---------------------------------- Notifications ---------------------------------- */

  var notifications = [
    { id: 'n1', type: 'assignment', title: 'Assignment due in 2 days', message: '“Linked List Implementation” for Data Structures & Algorithms closes on ' + D.format(D.relativeDays(2)) + '.', time: D.relativeDays(-0.3), course: 'Data Structures & Algorithms', read: false },
    { id: 'n2', type: 'quiz', title: 'New quiz available', message: '“Trees & BST” is now open for Data Structures & Algorithms. You have 3 attempts.', time: D.relativeDays(-0.6), course: 'Data Structures & Algorithms', read: false },
    { id: 'n3', type: 'grade', title: 'Grade published', message: 'Your result for Assignment 2 — Linked List (87/100) is now available.', time: D.relativeDays(-2), course: 'Data Structures & Algorithms', read: false },
    { id: 'n4', type: 'course', title: 'New material uploaded', message: 'Graph Representations.pdf added to Module 5 — Graphs of Computer Networks.', time: D.relativeDays(-3), course: 'Computer Networks', read: false },
    { id: 'n5', type: 'assignment', title: 'Assignment graded', message: 'Search Algorithms Essay was graded: 26/30 (87%).', time: D.relativeDays(-3), course: 'Artificial Intelligence', read: true },
    { id: 'n6', type: 'system', title: 'System maintenance', message: 'LearnHub will be offline on Sunday 02:00–04:00 IST for scheduled maintenance.', time: D.relativeDays(-5), course: null, read: true },
    { id: 'n7', type: 'grade', title: 'Mid-term results released', message: 'Mid-term Exam for Web Technologies: 44/50 (88%).', time: D.relativeDays(-6), course: 'Web Technologies', read: true }
  ];

  /* ---------------------------------- Faculty data ---------------------------------- */

  var pendingSubmissions = [
    { id: 's1', student: 'Meera Patel', studentId: 202, assignment: 'Linked List Implementation', courseId: 'cs201', course: 'Data Structures & Algorithms', submitted: D.relativeDays(-0.2), status: 'pending', file: 'meera_linkedlist.pdf', size: 940000 },
    { id: 's2', student: 'Rohan Gupta', studentId: 203, assignment: 'Linked List Implementation', courseId: 'cs201', course: 'Data Structures & Algorithms', submitted: D.relativeDays(-0.4), status: 'pending', file: 'rohan_linkedlist.pdf', size: 1200000 },
    { id: 's3', student: 'Sneha Reddy', studentId: 204, assignment: 'Network Topology Analysis', courseId: 'cs340', course: 'Computer Networks', submitted: D.relativeDays(-1), status: 'pending', file: 'sneha_topology.pdf', size: 810000 },
    { id: 's4', student: 'Alex Johnson', studentId: 201, assignment: 'Network Topology Analysis', courseId: 'cs340', course: 'Computer Networks', submitted: D.relativeDays(-2), status: 'reviewing', file: 'alex_topology.pdf', size: 1500000 },
    { id: 's5', student: 'Aditya Kumar', studentId: 207, assignment: 'ER Diagram for Library System', courseId: 'cs220', course: 'Database Management Systems', submitted: D.relativeDays(-0.1), status: 'pending', file: 'aditya_er.pdf', size: 670000 }
  ];

  var facultyActivity = [
    { icon: 'submission', text: 'Meera Patel submitted “Linked List Implementation”', time: D.relativeDays(-0.2), course: 'CS 201' },
    { icon: 'quiz', text: 'Quiz result recorded for 12 students in “Trees & BST”', time: D.relativeDays(-1), course: 'CS 201' },
    { icon: 'material', text: 'Uploaded “Graph Representations.pdf” to Computer Networks', time: D.relativeDays(-2), course: 'CS 340' },
    { icon: 'grade', text: 'Graded 5 submissions for “Search Algorithms Essay”', time: D.relativeDays(-3), course: 'CS 410' },
    { icon: 'student', text: '3 new students enrolled in Data Structures & Algorithms', time: D.relativeDays(-4), course: 'CS 201' }
  ];

  var facultyCourses = courses.map(function (c) {
    return { id: c.id, code: c.code, name: c.short, students: c.students, progress: c.progress, modules: c.modulesTotal, updated: c.updated, accent: c.accent, instructor: c.instructor };
  });

  /* ---------------------------------- Admin data ---------------------------------- */

  var adminUsers = [
    { id: 1, name: 'Alex Johnson', email: 'alex.j@learnhub.edu', role: 'student', status: 'active', lastActive: D.relativeDays(-0.2) },
    { id: 2, name: 'Meera Patel', email: 'meera.p@learnhub.edu', role: 'student', status: 'active', lastActive: D.relativeDays(-0.1) },
    { id: 3, name: 'Dr. Priya Sharma', email: 'priya.sharma@learnhub.edu', role: 'faculty', status: 'active', lastActive: D.relativeDays(-0.05) },
    { id: 4, name: 'Prof. Rohan Mehta', email: 'rohan.mehta@learnhub.edu', role: 'faculty', status: 'active', lastActive: D.relativeDays(-1) },
    { id: 5, name: 'Rahul Verma', email: 'admin@learnhub.com', role: 'admin', status: 'active', lastActive: D.relativeDays(-0.02) },
    { id: 6, name: 'Sneha Reddy', email: 'sneha.r@learnhub.edu', role: 'student', status: 'active', lastActive: D.relativeDays(-2) },
    { id: 7, name: 'Karan Singh', email: 'karan.s@learnhub.edu', role: 'student', status: 'warning', lastActive: D.relativeDays(-5) },
    { id: 8, name: 'Dr. Anjali Rao', email: 'anjali.rao@learnhub.edu', role: 'faculty', status: 'active', lastActive: D.relativeDays(-3) },
    { id: 9, name: 'Vivek Joshi', email: 'vivek.j@learnhub.edu', role: 'student', status: 'suspended', lastActive: D.relativeDays(-12) },
    { id: 10, name: 'Tanvi Desai', email: 'tanvi.d@learnhub.edu', role: 'student', status: 'active', lastActive: D.relativeDays(-0.8) }
  ];

  var adminSystemActivity = [
    { icon: 'student', text: 'New student registered', detail: 'Tanvi Desai enrolled in B.Tech IT', time: D.relativeDays(-0.8), type: 'success' },
    { icon: 'faculty', text: 'Faculty created a course', detail: 'Dr. Priya Sharma published “Graph Algorithms”', time: D.relativeDays(-1.2), type: 'info' },
    { icon: 'assignment', text: 'Assignment published', detail: '“Trees & BST” quiz set live in CS 201', time: D.relativeDays(-1.6), type: 'info' },
    { icon: 'grade', text: 'Quiz submitted', detail: '158 quiz submissions processed overnight', time: D.relativeDays(-2), type: 'warning' },
    { icon: 'system', text: 'Backup completed', detail: 'Nightly database backup succeeded', time: D.relativeDays(-2.5), type: 'success' },
    { icon: 'student', text: 'Enrollment window opened', detail: 'Spring 2027 course registration now open', time: D.relativeDays(-4), type: 'info' }
  ];

  var adminReports = {
    enrollmentByCourse: [
      { course: 'Data Structures & Algorithms', code: 'CS 201', students: 156 },
      { course: 'Operating Systems', code: 'CS 330', students: 190 },
      { course: 'Database Management Systems', code: 'CS 220', students: 178 },
      { course: 'Computer Networks', code: 'CS 340', students: 152 },
      { course: 'Artificial Intelligence', code: 'CS 410', students: 142 },
      { course: 'Web Technologies', code: 'CS 320', students: 140 }
    ],
    monthlyActive: [
      { month: 'Apr', active: 2340 }, { month: 'May', active: 2460 }, { month: 'Jun', active: 2180 },
      { month: 'Jul', active: 2510 }, { month: 'Aug', active: 2890 }, { month: 'Sep', active: 3120 }
    ],
    passRate: { passed: 1825, failed: 245, average: '88%' },
    distributionByProgram: [
      { program: 'B.Tech CSE', students: 1420 }, { program: 'B.Tech IT', students: 860 },
      { program: 'MCA', students: 410 }, { program: 'M.Tech', students: 215 }
    ]
  };

  var adminStats = {
    totalStudents: 2905,
    totalFaculty: 142,
    totalCourses: 38,
    activeUsers: 3124,
    newStudentsThisMonth: 132,
    newFacultyThisMonth: 6,
    submissionsToday: 214,
    avgAttendance: '84%'
  };

  LH.mock = {
    users: users,
    facultyList: facultyList,
    studentList: studentList,
    courses: courses,
    assignments: assignments,
    quizzes: quizzes,
    quizQuestions: quizQuestions,
    grades: grades,
    attendance: attendance,
    attendanceHistory: attendanceHistory,
    notifications: notifications,
    pendingSubmissions: pendingSubmissions,
    facultyActivity: facultyActivity,
    facultyCourses: facultyCourses,
    adminUsers: adminUsers,
    adminSystemActivity: adminSystemActivity,
    adminReports: adminReports,
    adminStats: adminStats
  };

})(window.LH);