const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        let query = { isPublished: true };
        if (req.query.category) query.category = req.query.category;
        if (req.query.level) query.level = req.query.level;
        if (req.query.search) query.title = { $regex: req.query.search, $options: 'i' };

        const courses = await Course.find(query)
            .select('title description category duration level price rating totalStudents tags lessons')
            .sort('-createdAt');

        const coursesWithCount = courses.map(course => ({
            ...course.toObject(),
            totalLessons: course.lessons ? course.lessons.length : 0
        }));

        res.status(200).json({ success: true, count: coursesWithCount.length, courses: coursesWithCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Sort lessons by order
        if (course.lessons) {
            course.lessons.sort((a, b) => a.order - b.order);
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Enroll in course
// @route   POST /api/courses/enroll
// @access  Private
exports.enrollCourse = async (req, res) => {
    try {
        const { courseName } = req.body;

        const courseMapping = {
            'python-basics': 'Python Basics',
            'python-cybersecurity': 'Python Applications in Cybersecurity',
            'html-css-js': 'HTML, CSS & JavaScript'
        };

        let course;
        if (courseMapping[courseName]) {
            course = await Course.findOne({ title: courseMapping[courseName] });
        } else {
            course = await Course.findById(courseName);
        }

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const user = await User.findById(req.user.id);
        const alreadyEnrolled = user.enrolledCourses.find(
            e => e.course.toString() === course._id.toString()
        );

        if (alreadyEnrolled) {
            return res.status(400).json({ success: false, message: 'Already enrolled' });
        }

        user.enrolledCourses.push({ course: course._id });
        await user.save();

        await Progress.create({ user: req.user.id, course: course._id });

        course.totalStudents = (course.totalStudents || 0) + 1;
        await course.save();

        res.status(200).json({ success: true, message: 'Enrolled!', courseId: course._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        await Course.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add single lesson to course
// @route   POST /api/courses/:id/lessons
// @access  Private/Admin
exports.addLesson = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const lessonData = req.body;
        lessonData.lessonId = (course.lessons ? course.lessons.length : 0) + 1;
        lessonData.order = lessonData.lessonId;

        course.lessons.push(lessonData);
        await course.save();

        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Python v9 lesson data — only used by populatePythonLessons below
// ─────────────────────────────────────────────────────────────────────────────
const PYTHON_V9_LESSONS = [
    // Module 1 – Python Fundamentals
    { module: 'Python Fundamentals', type: 'article',  title: 'Introduction to Python' },
    { module: 'Python Fundamentals', type: 'article',  title: 'Variables and Data Types' },
    { module: 'Python Fundamentals', type: 'article',  title: 'Strings' },
    { module: 'Python Fundamentals', type: 'article',  title: 'Working with Strings' },
    { module: 'Python Fundamentals', type: 'article',  title: 'Numbers and Arithmetic' },
    { module: 'Python Fundamentals', type: 'article',  title: 'Type Conversion' },
    { module: 'Python Fundamentals', type: 'article',  title: 'User Input' },
    { module: 'Python Fundamentals', type: 'workshop', title: 'Build a Basic Calculator' },
    { module: 'Python Fundamentals', type: 'workshop', title: 'Build a Unit Converter' },
    { module: 'Python Fundamentals', type: 'lab',      title: 'Implement a Temperature Converter' },
    { module: 'Python Fundamentals', type: 'review',   title: 'Python Fundamentals Review' },
    { module: 'Python Fundamentals', type: 'quiz',     title: 'Python Fundamentals Quiz' },

    // Module 2 – Control Flow
    { module: 'Control Flow', type: 'article',  title: 'Boolean Values and Comparisons' },
    { module: 'Control Flow', type: 'article',  title: 'Conditional Statements (if/elif/else)' },
    { module: 'Control Flow', type: 'article',  title: 'Logical Operators' },
    { module: 'Control Flow', type: 'article',  title: 'While Loops' },
    { module: 'Control Flow', type: 'article',  title: 'For Loops' },
    { module: 'Control Flow', type: 'article',  title: 'Loop Control (break, continue, pass)' },
    { module: 'Control Flow', type: 'article',  title: 'Nested Loops' },
    { module: 'Control Flow', type: 'workshop', title: 'Build a Number Guessing Game' },
    { module: 'Control Flow', type: 'workshop', title: 'Build a FizzBuzz Program' },
    { module: 'Control Flow', type: 'lab',      title: 'Implement the Luhn Algorithm' },
    { module: 'Control Flow', type: 'review',   title: 'Control Flow Review' },
    { module: 'Control Flow', type: 'quiz',     title: 'Control Flow Quiz' },

    // Module 3 – Functions
    { module: 'Functions', type: 'article',  title: 'Defining and Calling Functions' },
    { module: 'Functions', type: 'article',  title: 'Function Arguments and Parameters' },
    { module: 'Functions', type: 'article',  title: 'Return Statements' },
    { module: 'Functions', type: 'article',  title: 'Default and Keyword Arguments' },
    { module: 'Functions', type: 'article',  title: '*args and **kwargs' },
    { module: 'Functions', type: 'article',  title: 'Scope and Closures' },
    { module: 'Functions', type: 'article',  title: 'Lambda Functions' },
    { module: 'Functions', type: 'article',  title: 'Higher-Order Functions (map, filter, reduce)' },
    { module: 'Functions', type: 'workshop', title: 'Build a Cipher Encoder/Decoder' },
    { module: 'Functions', type: 'workshop', title: 'Build a Password Generator' },
    { module: 'Functions', type: 'lab',      title: 'Implement a Recursive Function' },
    { module: 'Functions', type: 'review',   title: 'Functions Review' },
    { module: 'Functions', type: 'quiz',     title: 'Functions Quiz' },
    { module: 'Functions', type: 'project',  title: 'Certification Project 1 — Budget App' },

    // Module 4 – Data Structures
    { module: 'Data Structures', type: 'article',  title: 'Lists' },
    { module: 'Data Structures', type: 'article',  title: 'List Methods and Slicing' },
    { module: 'Data Structures', type: 'article',  title: 'Tuples' },
    { module: 'Data Structures', type: 'article',  title: 'Sets' },
    { module: 'Data Structures', type: 'article',  title: 'Dictionaries' },
    { module: 'Data Structures', type: 'article',  title: 'Dictionary Methods' },
    { module: 'Data Structures', type: 'article',  title: 'List Comprehensions' },
    { module: 'Data Structures', type: 'article',  title: 'Dictionary Comprehensions' },
    { module: 'Data Structures', type: 'article',  title: 'Nested Data Structures' },
    { module: 'Data Structures', type: 'workshop', title: 'Build a Shopping Cart' },
    { module: 'Data Structures', type: 'workshop', title: 'Build a Contact Book' },
    { module: 'Data Structures', type: 'lab',      title: 'Implement a Stack using a List' },
    { module: 'Data Structures', type: 'review',   title: 'Data Structures Review' },
    { module: 'Data Structures', type: 'quiz',     title: 'Data Structures Quiz' },

    // Module 5 – Object-Oriented Programming
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Introduction to OOP' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Classes and Objects' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Instance Methods and Attributes' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Class Methods and Static Methods' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Inheritance' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Method Overriding and super()' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Encapsulation and Properties' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Dunder/Magic Methods' },
    { module: 'Object-Oriented Programming', type: 'article',  title: 'Polymorphism' },
    { module: 'Object-Oriented Programming', type: 'workshop', title: 'Build a Card Game' },
    { module: 'Object-Oriented Programming', type: 'workshop', title: 'Build an Animal Hierarchy' },
    { module: 'Object-Oriented Programming', type: 'lab',      title: 'Implement a Bank Account Class' },
    { module: 'Object-Oriented Programming', type: 'review',   title: 'Object-Oriented Programming Review' },
    { module: 'Object-Oriented Programming', type: 'quiz',     title: 'Object-Oriented Programming Quiz' },
    { module: 'Object-Oriented Programming', type: 'project',  title: 'Certification Project 2 — Polygon Area Calculator' },

    // Module 6 – Algorithms and Data Structures
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Big O Notation' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Recursion' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Sorting Algorithms (Bubble, Selection, Insertion)' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Advanced Sorting (Merge Sort, Quick Sort)' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Binary Search' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Linked Lists' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Stacks and Queues' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Hash Tables' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Trees and Binary Trees' },
    { module: 'Algorithms and Data Structures', type: 'article',  title: 'Graphs and Graph Traversal' },
    { module: 'Algorithms and Data Structures', type: 'workshop', title: 'Build a Linked List' },
    { module: 'Algorithms and Data Structures', type: 'workshop', title: 'Build a Binary Search Tree' },
    { module: 'Algorithms and Data Structures', type: 'lab',      title: 'Implement Merge Sort' },
    { module: 'Algorithms and Data Structures', type: 'review',   title: 'Algorithms and Data Structures Review' },
    { module: 'Algorithms and Data Structures', type: 'quiz',     title: 'Graphs and Trees Quiz' },
    { module: 'Algorithms and Data Structures', type: 'project',  title: 'Certification Project 3 — Probability Calculator' },

    // Module 7 – Modules, Files, and Error Handling
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Importing Modules and Packages' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'The Standard Library' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Reading and Writing Files' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Working with CSV and JSON' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Exception Handling (try/except/finally)' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Raising Custom Exceptions' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Decorators' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Generators and Iterators' },
    { module: 'Modules, Files, and Error Handling', type: 'article',  title: 'Regular Expressions' },
    { module: 'Modules, Files, and Error Handling', type: 'workshop', title: 'Build a File Organizer' },
    { module: 'Modules, Files, and Error Handling', type: 'workshop', title: 'Build a Log Parser' },
    { module: 'Modules, Files, and Error Handling', type: 'lab',      title: 'Implement a Custom Exception Handler' },
    { module: 'Modules, Files, and Error Handling', type: 'review',   title: 'Modules, Files, and Error Handling Review' },
    { module: 'Modules, Files, and Error Handling', type: 'quiz',     title: 'Modules, Files, and Error Handling Quiz' },
    { module: 'Modules, Files, and Error Handling', type: 'project',  title: 'Certification Project 4 — Time Calculator' },

    // Module 8 – Final Projects and Exam Prep
    { module: 'Final Projects and Exam Prep', type: 'article',  title: 'Python Best Practices and PEP 8' },
    { module: 'Final Projects and Exam Prep', type: 'article',  title: 'Debugging Techniques' },
    { module: 'Final Projects and Exam Prep', type: 'article',  title: 'Testing with unittest' },
    { module: 'Final Projects and Exam Prep', type: 'workshop', title: 'Build a Scientific Calculator' },
    { module: 'Final Projects and Exam Prep', type: 'workshop', title: 'Build a Text-Based Adventure Game' },
    { module: 'Final Projects and Exam Prep', type: 'lab',      title: 'Implement a Sudoku Solver' },
    { module: 'Final Projects and Exam Prep', type: 'review',   title: 'Comprehensive Review' },
    { module: 'Final Projects and Exam Prep', type: 'quiz',     title: 'Final Comprehensive Quiz' },
    { module: 'Final Projects and Exam Prep', type: 'project',  title: 'Certification Project 5 — Arithmetic Formatter' },
];

const DURATION_MAP = {
    article:  '15 min',
    workshop: '45 min',
    lab:      '30 min',
    review:   '10 min',
    quiz:     '20 min',
    project:  '60 min',
};

// @desc    Populate Python Basics course with Python v9 lessons
// @route   POST /api/courses/populate-python-lessons
// @access  Private/Admin
// NOTE:    Only touches "Python Basics". All other courses are untouched.
exports.populatePythonLessons = async (req, res) => {
    try {
        // Find ONLY the Python Basics course by title
        const course = await Course.findOne({ title: 'Python Basics' });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course "Python Basics" not found. Create it first, then call this endpoint.'
            });
        }

        // Build lesson documents with sequential lessonId / order
        const lessons = PYTHON_V9_LESSONS.map((item, idx) => ({
            lessonId:    idx + 1,
            order:       idx + 1,
            title:       item.title,
            module:      item.module,
            type:        item.type,
            duration:    DURATION_MAP[item.type] || '15 min',
            description: '',
            content:     '',
            videoUrl:    '',
            isFree:      true,
        }));

        // Replace lessons array entirely (idempotent — safe to call multiple times)
        course.lessons = lessons;
        await course.save();

        // Build summary by module for the response
        const moduleSummary = {};
        lessons.forEach(l => {
            moduleSummary[l.module] = (moduleSummary[l.module] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            message: `Successfully seeded ${lessons.length} lessons into "Python Basics".`,
            courseId: course._id,
            totalLessons: lessons.length,
            modules: moduleSummary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
