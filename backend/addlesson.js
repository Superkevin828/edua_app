require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edua';

async function addLessons() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find your courses
        const courses = await Course.find({});
        console.log('Available courses:');
        courses.forEach((c, i) => console.log(`${i + 1}. ${c.title} (${c._id})`));

        // Example: Add lessons to first course
        const course = courses[0];
        console.log(`\nAdding lessons to: ${course.title}\n`);

        const lessons = [
            {
                courseId: course._id,
                moduleId: "1",
                title: "Getting Started",
                description: "Introduction to the course",
                content: "<h2>Welcome!</h2><p>This is your first lesson. Get ready to learn!</p>",
                duration: "15 min",
                order: 1,
                type: "article",
                isFree: true
            },
            {
                courseId: course._id,
                moduleId: "1",
                title: "Your First Program",
                description: "Write your first program",
                content: "<h2>Hello World</h2><p>Let's write our first program!</p><pre><code>print('Hello, World!')</code></pre><p>Run this code to see the output.</p>",
                duration: "30 min",
                order: 2,
                type: "article",
                isFree: true
            },
            {
                courseId: course._id,
                moduleId: "1",
                title: "Practice Exercise",
                description: "Practice what you learned",
                content: "<h2>Practice Time</h2><p>Try these exercises:</p><ol><li>Print your name</li><li>Print a greeting</li><li>Print multiple lines</li></ol>",
                duration: "45 min",
                order: 3,
                type: "project",
                isFree: true
            }
        ];

        for (let lessonData of lessons) {
            const lesson = await Lesson.create(lessonData);
            
            // Add lesson to course module
            await Course.updateOne(
                { _id: course._id, "modules.order": parseInt(lessonData.moduleId) },
                { $push: { "modules.$.lessons": lesson._id } }
            );
            
            console.log(`✅ Created: ${lesson.title}`);
        }

        console.log('\n✅ All lessons added successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addLessons();