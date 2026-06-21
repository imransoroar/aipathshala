/* Reusable seeding logic shared by the CLI seeder and the server's
 * auto-seed-on-first-boot. Inserts demo data into an (assumed empty) store. */
const bcrypt = require('bcryptjs');

function seedDatabase(db) {
  const yt = (id) => 'https://www.youtube.com/embed/' + id;

  const categories = [
    { name: 'Machine Learning', nameBn: 'মেশিন লার্নিং', slug: 'machine-learning', icon: '🤖' },
    { name: 'Generative AI', nameBn: 'জেনারেটিভ এআই', slug: 'generative-ai', icon: '✨' },
    { name: 'Data Science', nameBn: 'ডেটা সায়েন্স', slug: 'data-science', icon: '📊' },
    { name: 'Programming', nameBn: 'প্রোগ্রামিং', slug: 'programming', icon: '💻' },
    { name: 'Career Skills', nameBn: 'ক্যারিয়ার স্কিল', slug: 'career-skills', icon: '🚀' },
  ];
  categories.forEach((c) => db.insert('categories', c));

  const admin = db.insert('users', {
    name: 'AI Pathshala Admin', email: 'admin@aipathshala.com',
    passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin', phone: '01700000000', bio: 'Platform administrator',
  });
  const student = db.insert('users', {
    name: 'Demo Student', email: 'student@aipathshala.com',
    passwordHash: bcrypt.hashSync('student123', 10), role: 'student', phone: '01800000000', bio: 'Lifelong learner',
  });

  const courses = [
    { title: 'AI for Everyone (Bangla)', titleBn: 'সবার জন্য এআই', slug: 'ai-for-everyone',
      category: 'Generative AI', categorySlug: 'generative-ai',
      summary: 'A non-technical introduction to Artificial Intelligence and how to use it in daily life and work.',
      summaryBn: 'কৃত্রিম বুদ্ধিমত্তার সহজ পরিচিতি এবং দৈনন্দিন জীবন ও কাজে এর ব্যবহার।',
      description: 'Understand what AI really is, where it is used, and how tools like ChatGPT can boost your productivity. No coding needed.',
      descriptionBn: 'এআই আসলে কী, কোথায় ব্যবহৃত হয় এবং ChatGPT-এর মতো টুল দিয়ে কীভাবে কাজের গতি বাড়ানো যায় তা শিখুন। কোনো কোডিং লাগবে না।',
      price: 1500, discountPrice: 990, level: 'beginner', language: 'Bangla', instructor: 'Rakib Hasan',
      featured: true, published: true, tags: ['AI', 'ChatGPT', 'Beginner'],
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=640&q=70',
      lessons: [
        { title: 'What is Artificial Intelligence?', titleBn: 'কৃত্রিম বুদ্ধিমত্তা কী?', durationMin: 12, preview: true, video: 'ad79nYk2keg' },
        { title: 'A short history of AI', titleBn: 'এআই-এর সংক্ষিপ্ত ইতিহাস', durationMin: 10, video: 'kWmX3pd1f10' },
        { title: 'Using ChatGPT effectively', titleBn: 'কার্যকরভাবে ChatGPT ব্যবহার', durationMin: 18, video: 'JTxsNm9IdYU' },
        { title: 'AI in your career', titleBn: 'আপনার ক্যারিয়ারে এআই', durationMin: 15, video: 'aircAruvnKk' } ] },
    { title: 'Python Programming from Zero', titleBn: 'শূন্য থেকে পাইথন প্রোগ্রামিং', slug: 'python-from-zero',
      category: 'Programming', categorySlug: 'programming',
      summary: 'Learn Python step by step in Bangla and build your first real programs.',
      summaryBn: 'বাংলায় ধাপে ধাপে পাইথন শিখুন এবং প্রথম বাস্তব প্রোগ্রাম তৈরি করুন।',
      description: 'From variables to functions, loops and projects — the perfect first programming language for AI and data science.',
      descriptionBn: 'ভেরিয়েবল থেকে ফাংশন, লুপ ও প্রজেক্ট — এআই ও ডেটা সায়েন্সের জন্য আদর্শ প্রথম প্রোগ্রামিং ভাষা।',
      price: 2000, discountPrice: 1290, level: 'beginner', language: 'Bangla', instructor: 'Nusrat Jahan',
      featured: true, published: true, tags: ['Python', 'Programming', 'Beginner'],
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=640&q=70',
      lessons: [
        { title: 'Installing Python & setup', titleBn: 'পাইথন ইনস্টল ও সেটআপ', durationMin: 9, preview: true, video: '_uQrJ0TkZlc' },
        { title: 'Variables and data types', titleBn: 'ভেরিয়েবল ও ডেটা টাইপ', durationMin: 14, video: 'cQT33yu9pY8' },
        { title: 'Loops and conditions', titleBn: 'লুপ ও কন্ডিশন', durationMin: 16, video: '6iF8Xb7Z3wQ' },
        { title: 'Functions', titleBn: 'ফাংশন', durationMin: 13, video: '9Os0o3wzS_I' },
        { title: 'Mini project: calculator', titleBn: 'মিনি প্রজেক্ট: ক্যালকুলেটর', durationMin: 20, video: 'rfscVS0vtbw' } ] },
    { title: 'Machine Learning Foundations', titleBn: 'মেশিন লার্নিং ফাউন্ডেশন', slug: 'ml-foundations',
      category: 'Machine Learning', categorySlug: 'machine-learning',
      summary: 'Core ML concepts: regression, classification, and model evaluation with scikit-learn.',
      summaryBn: 'মূল এমএল ধারণা: রিগ্রেশন, ক্লাসিফিকেশন এবং scikit-learn দিয়ে মডেল মূল্যায়ন।',
      description: 'Build a solid foundation in supervised learning with hands-on Python notebooks.',
      descriptionBn: 'হাতে-কলমে পাইথন নোটবুকের মাধ্যমে সুপারভাইজড লার্নিংয়ে শক্ত ভিত্তি গড়ুন।',
      price: 3500, discountPrice: 2490, level: 'intermediate', language: 'Bangla', instructor: 'Dr. Imran Khan',
      featured: true, published: true, tags: ['Machine Learning', 'scikit-learn', 'Python'],
      thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=640&q=70',
      lessons: [
        { title: 'What is Machine Learning?', titleBn: 'মেশিন লার্নিং কী?', durationMin: 11, preview: true, video: 'ukzFI9rgwfU' },
        { title: 'Linear regression', titleBn: 'লিনিয়ার রিগ্রেশন', durationMin: 22, video: 'nk2CQITm_eo' },
        { title: 'Classification basics', titleBn: 'ক্লাসিফিকেশন বেসিক', durationMin: 19, video: 'pqNCD_5r0IU' },
        { title: 'Evaluating models', titleBn: 'মডেল মূল্যায়ন', durationMin: 17, video: '85dtiMz9tSo' } ] },
    { title: 'Prompt Engineering Mastery', titleBn: 'প্রম্পট ইঞ্জিনিয়ারিং মাস্টারি', slug: 'prompt-engineering',
      category: 'Generative AI', categorySlug: 'generative-ai',
      summary: 'Write powerful prompts for ChatGPT, Claude and image models to get professional results.',
      summaryBn: 'ChatGPT, Claude ও ইমেজ মডেলের জন্য শক্তিশালী প্রম্পট লিখে পেশাদার ফলাফল পান।',
      description: 'Patterns, frameworks and real workflows for getting the most out of large language models.',
      descriptionBn: 'বড় ভাষা মডেল থেকে সর্বোচ্চ ফল পেতে প্যাটার্ন, ফ্রেমওয়ার্ক ও বাস্তব ওয়ার্কফ্লো।',
      price: 2500, discountPrice: 0, level: 'beginner', language: 'Bangla', instructor: 'Tanvir Ahmed',
      featured: false, published: true, tags: ['Prompt', 'LLM', 'ChatGPT', 'Claude'],
      thumbnail: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=640&q=70',
      lessons: [
        { title: 'How LLMs read prompts', titleBn: 'এলএলএম কীভাবে প্রম্পট পড়ে', durationMin: 13, preview: true, video: 'zjkBMFhNj_g' },
        { title: 'The anatomy of a great prompt', titleBn: 'একটি ভালো প্রম্পটের গঠন', durationMin: 16, video: 'dOxUroR57xs' },
        { title: 'Advanced techniques', titleBn: 'উন্নত কৌশল', durationMin: 21, video: 'bZQun8Y4L2A' } ] },
    { title: 'Data Analysis with Pandas', titleBn: 'প্যান্ডাস দিয়ে ডেটা অ্যানালাইসিস', slug: 'data-analysis-pandas',
      category: 'Data Science', categorySlug: 'data-science',
      summary: 'Clean, analyse and visualise real datasets using Python Pandas and Matplotlib.',
      summaryBn: 'পাইথন প্যান্ডাস ও ম্যাটপ্লটলিব দিয়ে বাস্তব ডেটাসেট পরিষ্কার, বিশ্লেষণ ও ভিজ্যুয়ালাইজ করুন।',
      description: 'A practical, project-based course for aspiring data analysts.',
      descriptionBn: 'ভবিষ্যৎ ডেটা অ্যানালিস্টদের জন্য বাস্তবমুখী, প্রজেক্টভিত্তিক কোর্স।',
      price: 3000, discountPrice: 1990, level: 'intermediate', language: 'Bangla', instructor: 'Sadia Rahman',
      featured: false, published: true, tags: ['Pandas', 'Data', 'Python'],
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&q=70',
      lessons: [
        { title: 'Intro to Pandas', titleBn: 'প্যান্ডাস পরিচিতি', durationMin: 12, preview: true, video: 'vmEHCJofslg' },
        { title: 'Cleaning messy data', titleBn: 'অগোছালো ডেটা পরিষ্কার', durationMin: 18, video: 'iYie42M1ZyU' },
        { title: 'Plotting & visualisation', titleBn: 'প্লট ও ভিজ্যুয়ালাইজেশন', durationMin: 20, video: 'UO98lJQ3QGI' } ] },
    { title: 'Deep Learning with PyTorch', titleBn: 'পাইটর্চ দিয়ে ডিপ লার্নিং', slug: 'deep-learning-pytorch',
      category: 'Machine Learning', categorySlug: 'machine-learning',
      summary: 'Build and train neural networks for vision and text using PyTorch.',
      summaryBn: 'পাইটর্চ ব্যবহার করে ভিশন ও টেক্সটের জন্য নিউরাল নেটওয়ার্ক তৈরি ও প্রশিক্ষণ।',
      description: 'From tensors to convolutional networks, with hands-on training loops.',
      descriptionBn: 'টেনসর থেকে কনভল্যুশনাল নেটওয়ার্ক পর্যন্ত, হাতে-কলমে ট্রেনিং লুপসহ।',
      price: 4500, discountPrice: 3490, level: 'advanced', language: 'Bangla', instructor: 'Dr. Imran Khan',
      featured: true, published: true, tags: ['Deep Learning', 'PyTorch', 'Neural Networks'],
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=70',
      lessons: [
        { title: 'Tensors & autograd', titleBn: 'টেনসর ও অটোগ্র্যাড', durationMin: 16, preview: true, video: 'IC0_FRiX-sw' },
        { title: 'Building a neural network', titleBn: 'নিউরাল নেটওয়ার্ক তৈরি', durationMin: 24, video: 'Jy4wM2X21u0' },
        { title: 'CNNs for images', titleBn: 'ইমেজের জন্য সিএনএন', durationMin: 26, video: 'pDdP0TFzsoQ' },
        { title: 'Training & fine-tuning', titleBn: 'ট্রেনিং ও ফাইন-টিউনিং', durationMin: 22, video: 'wnK3uWv_WkU' } ] },
  ];

  courses.forEach((c) => {
    const { lessons, ...courseData } = c;
    const course = db.insert('courses', courseData);
    const half = Math.ceil(lessons.length / 2);
    lessons.forEach((l, i) => db.insert('lessons', {
      courseId: course.id, title: l.title, titleBn: l.titleBn, videoUrl: yt(l.video),
      content: '', durationMin: l.durationMin, order: i + 1, preview: !!l.preview,
      section: i < half ? 'Getting Started' : 'Core Concepts',
      sectionBn: i < half ? 'শুরুর ধাপ' : 'মূল ধারণা',
    }));
  });

  const firstCourse = db.findOne('courses', { slug: 'ai-for-everyone' });
  db.insert('enrollments', { userId: student.id, courseId: firstCourse.id, completedLessons: [] });
  db.insert('reviews', { userId: student.id, courseId: firstCourse.id, rating: 5, comment: 'দারুণ কোর্স! সহজ ভাষায় বুঝিয়েছে।' });
  const mlCourse = db.findOne('courses', { slug: 'ml-foundations' });
  db.insert('reviews', { userId: student.id, courseId: mlCourse.id, rating: 4, comment: 'Very practical and clear.' });

  return { courses: db.count('courses'), lessons: db.count('lessons') };
}

function seedIfEmpty(db) {
  if (db.count('users') > 0) return false;
  seedDatabase(db);
  console.log('[seed] empty database detected — demo data seeded automatically.');
  return true;
}

module.exports = { seedDatabase, seedIfEmpty };
