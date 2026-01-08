const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import your models
const User = require('./models/User');
const Achievement = require('./models/Achievement');
const Connection = require('./models/Connection');
const Notification = require('./models/Notification');
const PrivacySetting = require('./models/PrivacySetting');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const dbConfig = require('./config/database');
    await dbConfig();
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Dummy Users Data
const usersData = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@college.edu',
    rollNumber: 'CS2021001',
    password: 'password123',
    year: '3',
    branch: 'Computer Science',
    bio: 'Full-stack developer passionate about AI and ML',
    phone: '9876543210',
    linkedIn: 'https://linkedin.com/in/rahulsharma',
    github: 'https://github.com/rahulsharma',
    skills: ['React', 'Node.js', 'Python', 'MongoDB'],
    interests: ['Web Development', 'AI', 'Open Source'],
    verified: true,
    isAdmin: false
  },
  {
    name: 'Priya Patel',
    email: 'priya@college.edu',
    rollNumber: 'CS2021002',
    password: 'password123',
    year: '3',
    branch: 'Computer Science',
    bio: 'UI/UX designer and frontend developer',
    phone: '9876543211',
    linkedIn: 'https://linkedin.com/in/priyapatel',
    github: 'https://github.com/priyapatel',
    skills: ['React', 'Figma', 'JavaScript', 'CSS'],
    interests: ['UI/UX Design', 'Frontend Development'],
    verified: true,
    isAdmin: false
  },
  {
    name: 'Amit Kumar',
    email: 'amit@college.edu',
    rollNumber: 'CS2022001',
    password: 'password123',
    year: '2',
    branch: 'Computer Science',
    bio: 'Backend enthusiast and competitive programmer',
    phone: '9876543212',
    linkedIn: 'https://linkedin.com/in/amitkumar',
    github: 'https://github.com/amitkumar',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis'],
    interests: ['Backend Development', 'Competitive Programming'],
    verified: true,
    isAdmin: false
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@college.edu',
    rollNumber: 'EC2021001',
    password: 'password123',
    year: '3',
    branch: 'Electronics',
    bio: 'IoT enthusiast and embedded systems developer',
    phone: '9876543213',
    linkedIn: 'https://linkedin.com/in/snehareddy',
    github: 'https://github.com/snehareddy',
    skills: ['Arduino', 'Python', 'C++', 'IoT'],
    interests: ['IoT', 'Embedded Systems', 'Robotics'],
    verified: true,
    isAdmin: false
  },
  {
    name: 'Admin User',
    email: 'admin@college.edu',
    rollNumber: 'ADMIN001',
    password: 'admin123',
    year: '4',
    branch: 'Computer Science',
    bio: 'System Administrator',
    phone: '9876543214',
    verified: true,
    isAdmin: true
  }
];

// Function to create users
const createUsers = async () => {
  console.log('📝 Creating users...');
  const createdUsers = [];
  
  for (const userData of usersData) {
    try {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.name} (${user.rollNumber})`);
    } catch (error) {
      console.error(`   ✗ Error creating user ${userData.name}:`, error.message);
    }
  }
  
  return createdUsers;
};

// Function to create achievements
const createAchievements = async (users) => {
  console.log('\n🏆 Creating achievements...');
  
  const achievementsData = [
    {
      title: 'E-Commerce Platform with AI Recommendations',
      description: 'Built a full-stack e-commerce platform with personalized product recommendations using machine learning. Implemented user authentication, payment gateway integration, and real-time inventory management.',
      studentId: users[0]._id,
      studentName: users[0].name,
      studentRollNumber: users[0].rollNumber,
      branch: users[0].branch,
      year: users[0].year,
      category: 'project',
      technologies: ['React', 'Node.js', 'MongoDB', 'TensorFlow', 'Stripe API'],
      githubLink: 'https://github.com/rahulsharma/ecommerce-ai',
      liveLink: 'https://ecommerce-demo.herokuapp.com',
      featured: true,
      status: 'approved'
    },
    {
      title: 'Won Smart India Hackathon 2024',
      description: 'Developed a disaster management system that uses real-time data analytics and machine learning to predict and manage natural disasters. Our team secured first place among 500+ teams nationwide.',
      studentId: users[0]._id,
      studentName: users[0].name,
      studentRollNumber: users[0].rollNumber,
      branch: users[0].branch,
      year: users[0].year,
      category: 'hackathon',
      technologies: ['Python', 'Flask', 'React', 'TensorFlow', 'AWS'],
      githubLink: 'https://github.com/rahulsharma/disaster-mgmt',
      featured: true,
      status: 'approved'
    },
    {
      title: 'College Event Management System',
      description: 'Created a comprehensive event management platform for college fests and technical events. Features include online registration, payment processing, certificate generation, and real-time event tracking.',
      studentId: users[1]._id,
      studentName: users[1].name,
      studentRollNumber: users[1].rollNumber,
      branch: users[1].branch,
      year: users[1].year,
      category: 'project',
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io'],
      githubLink: 'https://github.com/priyapatel/event-manager',
      liveLink: 'https://college-events.vercel.app',
      status: 'approved'
    },
    {
      title: 'AWS Cloud Practitioner Certification',
      description: 'Successfully completed AWS Cloud Practitioner certification, demonstrating foundational understanding of AWS Cloud, services, and terminology. Scored 920/1000 in the certification exam.',
      studentId: users[1]._id,
      studentName: users[1].name,
      studentRollNumber: users[1].rollNumber,
      branch: users[1].branch,
      year: users[1].year,
      category: 'certification',
      technologies: ['AWS', 'Cloud Computing'],
      status: 'approved'
    },
    {
      title: 'Online Judge Platform for Competitive Programming',
      description: 'Developed a platform similar to LeetCode for practicing competitive programming. Includes automated code evaluation, real-time leaderboards, and discussion forums. Supporting 5+ programming languages.',
      studentId: users[2]._id,
      studentName: users[2].name,
      studentRollNumber: users[2].rollNumber,
      branch: users[2].branch,
      year: users[2].year,
      category: 'project',
      technologies: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Redis'],
      githubLink: 'https://github.com/amitkumar/online-judge',
      liveLink: 'https://codejudge.netlify.app',
      featured: true,
      status: 'approved'
    },
    {
      title: 'Research Paper on ML-based Fraud Detection',
      description: 'Published research paper on machine learning algorithms for detecting fraudulent transactions in real-time. Achieved 98.5% accuracy using ensemble learning methods. Paper presented at ICML 2024.',
      studentId: users[2]._id,
      studentName: users[2].name,
      studentRollNumber: users[2].rollNumber,
      branch: users[2].branch,
      year: users[2].year,
      category: 'publication',
      technologies: ['Python', 'Scikit-learn', 'TensorFlow'],
      status: 'approved'
    },
    {
      title: 'Smart Home Automation using IoT',
      description: 'Designed and implemented a complete smart home automation system using Arduino and Raspberry Pi. Features include voice control, mobile app integration, energy monitoring, and automated scheduling.',
      studentId: users[3]._id,
      studentName: users[3].name,
      studentRollNumber: users[3].rollNumber,
      branch: users[3].branch,
      year: users[3].year,
      category: 'project',
      technologies: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React Native'],
      githubLink: 'https://github.com/snehareddy/smart-home',
      featured: true,
      status: 'approved'
    },
    {
      title: 'Winner - National Robotics Competition 2024',
      description: 'Built an autonomous line-following robot with obstacle detection and path optimization. Won first prize in the national level competition organized by IIT Bombay.',
      studentId: users[3]._id,
      studentName: users[3].name,
      studentRollNumber: users[3].rollNumber,
      branch: users[3].branch,
      year: users[3].year,
      category: 'competition',
      technologies: ['Arduino', 'C++', 'Sensors', 'Motors'],
      status: 'approved'
    },
    {
      title: 'Real-time Chat Application',
      description: 'Created a real-time messaging application with features like group chats, file sharing, video calls, and end-to-end encryption. Supports 1000+ concurrent users.',
      studentId: users[0]._id,
      studentName: users[0].name,
      studentRollNumber: users[0].rollNumber,
      branch: users[0].branch,
      year: users[0].year,
      category: 'project',
      technologies: ['React', 'Node.js', 'Socket.io', 'WebRTC', 'MongoDB'],
      githubLink: 'https://github.com/rahulsharma/chat-app',
      status: 'pending'
    }
  ];
  
  const createdAchievements = [];
  
  for (const achData of achievementsData) {
    try {
      const achievement = await Achievement.create(achData);
      createdAchievements.push(achievement);
      console.log(`   ✓ Created achievement: ${achievement.title}`);
    } catch (error) {
      console.error(`   ✗ Error creating achievement:`, error.message);
    }
  }
  
  return createdAchievements;
};

// Function to create connections
const createConnections = async (users) => {
  console.log('\n🤝 Creating connections...');
  
  const connectionsData = [
    {
      senderId: users[0]._id,
      receiverId: users[1]._id,
      status: 'accepted',
      message: 'Hey! Would love to connect and collaborate on projects!',
      respondedAt: new Date()
    },
    {
      senderId: users[0]._id,
      receiverId: users[2]._id,
      status: 'accepted',
      message: 'Great work on your projects! Let\'s connect.',
      respondedAt: new Date()
    },
    {
      senderId: users[1]._id,
      receiverId: users[3]._id,
      status: 'accepted',
      message: 'Interested in learning more about IoT!',
      respondedAt: new Date()
    },
    {
      senderId: users[2]._id,
      receiverId: users[3]._id,
      status: 'pending',
      message: 'Would like to discuss about embedded systems.'
    },
    {
      senderId: users[3]._id,
      receiverId: users[0]._id,
      status: 'pending',
      message: 'Can we collaborate on an IoT + AI project?'
    }
  ];
  
  for (const connData of connectionsData) {
    try {
      const connection = await Connection.create(connData);
      console.log(`   ✓ Created connection: ${connection._id}`);
    } catch (error) {
      console.error(`   ✗ Error creating connection:`, error.message);
    }
  }
};

// Function to create privacy settings
const createPrivacySettings = async (users) => {
  console.log('\n🔒 Creating privacy settings...');
  
  for (const user of users) {
    try {
      await PrivacySetting.create({
        userId: user._id,
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        showConnections: true,
        showAchievements: true,
        allowConnectionRequests: true
      });
      console.log(`   ✓ Created privacy settings for: ${user.name}`);
    } catch (error) {
      console.error(`   ✗ Error creating privacy settings:`, error.message);
    }
  }
};

// Function to create notifications
const createNotifications = async (users) => {
  console.log('\n🔔 Creating notifications...');
  
  const notificationsData = [
    {
      userId: users[1]._id,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${users[0].name} sent you a connection request`,
      relatedId: users[0]._id,
      relatedModel: 'User',
      isRead: false
    },
    {
      userId: users[0]._id,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${users[1].name} accepted your connection request`,
      relatedId: users[1]._id,
      relatedModel: 'User',
      isRead: true
    },
    {
      userId: users[2]._id,
      type: 'achievement_liked',
      title: 'Someone liked your achievement',
      message: `${users[0].name} liked your achievement`,
      isRead: false
    }
  ];
  
  for (const notifData of notificationsData) {
    try {
      await Notification.create(notifData);
      console.log(`   ✓ Created notification for user`);
    } catch (error) {
      console.error(`   ✗ Error creating notification:`, error.message);
    }
  }
};

// Function to add likes to achievements
const addLikesToAchievements = async (users, achievements) => {
  console.log('\n❤️  Adding likes to achievements...');
  
  try {
    // User 0 likes achievements of User 1 and User 2
    await Achievement.findByIdAndUpdate(achievements[2]._id, {
      $push: { likes: users[0]._id }
    });
    await Achievement.findByIdAndUpdate(achievements[4]._id, {
      $push: { likes: users[0]._id }
    });
    
    // User 1 likes achievements of User 0
    await Achievement.findByIdAndUpdate(achievements[0]._id, {
      $push: { likes: users[1]._id }
    });
    
    console.log('   ✓ Added likes to achievements');
  } catch (error) {
    console.error('   ✗ Error adding likes:', error.message);
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Achievement.deleteMany({});
    await Connection.deleteMany({});
    await Notification.deleteMany({});
    await PrivacySetting.deleteMany({});
    console.log('   ✓ Cleared all collections\n');
    
    // Create data
    const users = await createUsers();
    const achievements = await createAchievements(users);
    await createConnections(users);
    await createPrivacySettings(users);
    await createNotifications(users);
    await addLikesToAchievements(users, achievements);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users created: ${users.length}`);
    console.log(`   Achievements created: ${achievements.length}`);
    console.log('\n📝 Test Login Credentials:');
    console.log('   Email: rahul@college.edu | Password: password123');
    console.log('   Email: priya@college.edu | Password: password123');
    console.log('   Email: amit@college.edu | Password: password123');
    console.log('   Email: admin@college.edu | Password: admin123 (Admin)\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();