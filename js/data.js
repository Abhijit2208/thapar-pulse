/**
 * ThaparPulse - Real TIET Patiala Seed Data
 */

const THAPAR_DATA = {
  // Official TIET 3-digit Branch Code Table
  branchCodes: {
    // Core Computer Science & IT
    "017": { code: "COPC", name: "Computer Science & Engineering (COPC)", short: "COPC", stream: "CS" },
    "015": { code: "COPC", name: "Computer Science & Engineering (COPC)", short: "COPC", stream: "CS" },
    "003": { code: "COE", name: "Computer Engineering (COE)", short: "COE", stream: "CS" },
    "004": { code: "COE", name: "Computer Engineering (COE)", short: "COE", stream: "CS" },
    "016": { code: "COBS", name: "Computer Science & Business Systems (COBS)", short: "COBS", stream: "CS" },
    "034": { code: "AIML", name: "Artificial Intelligence & Machine Learning (AIML)", short: "AIML", stream: "CS" },
    "023": { code: "COSE", name: "Computer Science & Engineering (Derabassi)", short: "COSE", stream: "CS" },

    // Electronics & Electrical
    "019": { code: "ECE", name: "Electronics & Communication Engineering (ECE)", short: "ECE", stream: "EC" },
    "018": { code: "ENC", name: "Electronics & Computer Engineering (ENC)", short: "ENC", stream: "EC" },
    "006": { code: "EE", name: "Electrical Engineering (EE)", short: "EE", stream: "EE" },
    "020": { code: "EEC", name: "Electrical & Computer Engineering (EEC)", short: "EEC", stream: "EE" },
    "011": { code: "EIC", name: "Electronics (Instrumentation & Control) (EIC)", short: "EIC", stream: "EC" },

    // Mechanical & Civil
    "008": { code: "ME", name: "Mechanical Engineering (ME)", short: "ME", stream: "ME" },
    "025": { code: "LC", name: "Mechatronics Engineering", short: "Mechatronics", stream: "ME" },
    "002": { code: "CE", name: "Civil Engineering (CE)", short: "CE", stream: "CE" },
    "009": { code: "MPE", name: "Mechanical Engineering (Production) (MPE)", short: "MPE", stream: "ME" },

    // Chemical & Specialized Sciences
    "001": { code: "CHE", name: "Chemical Engineering (CHE)", short: "CHE", stream: "CH" },
    "031": { code: "BME", name: "Biomedical Engineering (BME)", short: "BME", stream: "BT" },
    "041": { code: "BT", name: "Biotechnology (BT)", short: "Biotech", stream: "BT" }
  },

  decodeRollNumber(rollNumber) {
    if (!rollNumber) return null;
    const clean = String(rollNumber).trim().replace(/\D/g, '');
    
    // TIET 9-digit format: [Entry Category 1 digit][Admission Year 2 digits][Branch Code 3 digits][Serial Seq 3 digits]
    // Example: 102401742 -> Regular B.E. (1), Batch 2024 (24), Branch 017 (COPC), Seq 042
    let entryType = "Regular B.E. / B.Tech";
    let admYear = 2024;
    let branchInfo = this.branchCodes["003"]; // fallback COE
    let seqNumber = "001";

    if (clean.length >= 6) {
      const entryDigit = clean.charAt(0);
      if (entryDigit === '7') entryType = "Lateral Entry / Specialized (LEET)";
      
      const yearDigits = clean.substring(1, 3);
      admYear = 2000 + parseInt(yearDigits, 10);

      // Extract 3-digit branch code (index 3 to 6)
      const bCode = clean.substring(3, 6);
      if (this.branchCodes[bCode]) {
        branchInfo = this.branchCodes[bCode];
      } else {
        // Fallback for short patterns
        const foundKey = Object.keys(this.branchCodes).find(k => clean.includes(k));
        if (foundKey) branchInfo = this.branchCodes[foundKey];
      }

      if (clean.length >= 9) {
        seqNumber = clean.substring(6, 9);
      }
    }

    const gradYear = admYear + 4;
    let semester = 4;
    let yearName = "2nd Year (Sophomores)";

    if (admYear >= 2025) { semester = 2; yearName = "1st Year (Freshers)"; }
    else if (admYear === 2024) { semester = 4; yearName = "2nd Year (Sophomores)"; }
    else if (admYear === 2023) { semester = 6; yearName = "3rd Year (Juniors)"; }
    else { semester = 8; yearName = "4th Year (Final Year)"; }

    return {
      entryType,
      admissionYear: admYear,
      graduationYear: gradYear,
      batchString: `Batch of ${admYear}-${String(gradYear).slice(2)}`,
      yearName,
      semester,
      branchCode: branchInfo.code,
      branchName: branchInfo.name,
      branchShort: branchInfo.short,
      stream: branchInfo.stream,
      seqNumber
    };
  },

  // User Profile Default
  userProfile: {
    name: "Aarav Sharma",
    rollNumber: "102401742",
    branch: "Computer Science & Engineering (COPC)",
    semester: 4,
    hostel: "Hostel J (Tower 3)",
    targetAttendance: 75
  },

  // Semester-wise realistic TIET courses database
  semesterPresets: {
    1: [
      { id: "sub-101", code: "UMA010", name: "Mathematics - I (Calculus & Linear Algebra)", faculty: "Dr. Meenakshi Rana", totalClasses: 36, attendedClasses: 32, credits: 4.0 },
      { id: "sub-102", code: "UPH004", name: "Applied Physics & Mechanics", faculty: "Dr. Sanjeev Kumar", totalClasses: 30, attendedClasses: 27, credits: 3.5 },
      { id: "sub-103", code: "UEE001", name: "Electrical Engineering Fundamentals", faculty: "Dr. Vikas Goyal", totalClasses: 28, attendedClasses: 22, credits: 3.5 },
      { id: "sub-104", code: "UTA007", name: "Computer Programming in C", faculty: "Dr. Anju Sharma", totalClasses: 34, attendedClasses: 30, credits: 4.0 },
      { id: "sub-105", code: "UHU003", name: "Professional Communication", faculty: "Prof. Sonia Sharma", totalClasses: 24, attendedClasses: 19, credits: 2.0 },
      { id: "sub-106", code: "UEN002", name: "Energy & Environment", faculty: "Dr. Radhika Sen", totalClasses: 20, attendedClasses: 17, credits: 2.0 }
    ],
    2: [
      { id: "sub-201", code: "UMA004", name: "Mathematics - II (Differential Equations)", faculty: "Dr. Amit Verma", totalClasses: 36, attendedClasses: 31, credits: 4.0 },
      { id: "sub-202", code: "UCB008", name: "Applied Chemistry & Lab", faculty: "Dr. Amjad Ali", totalClasses: 30, attendedClasses: 25, credits: 3.5 },
      { id: "sub-203", code: "UTA018", name: "Object Oriented Programming (C++)", faculty: "Dr. Seema Bawa", totalClasses: 36, attendedClasses: 32, credits: 4.0 },
      { id: "sub-204", code: "UES009", name: "Mechanics for Engineers", faculty: "Dr. Tarun Garg", totalClasses: 28, attendedClasses: 21, credits: 3.5 },
      { id: "sub-205", code: "UTA015", name: "Engineering Drawing & Graphics (ED)", faculty: "Prof. H. S. Bawa", totalClasses: 32, attendedClasses: 28, credits: 3.0 },
      { id: "sub-206", code: "UTA024", name: "Engineering Design Project - I", faculty: "Dr. Kuldeep Singh", totalClasses: 24, attendedClasses: 22, credits: 2.0 }
    ],
    3: [
      { id: "sub-301", code: "UCS301", name: "Data Structures & Algorithms", faculty: "Dr. Rajesh Kumar", totalClasses: 36, attendedClasses: 32, credits: 4.0 },
      { id: "sub-302", code: "UCS303", name: "Operating Systems", faculty: "Dr. Neha Garg", totalClasses: 30, attendedClasses: 24, credits: 3.5 },
      { id: "sub-303", code: "UEC001", name: "Electronic Devices & Digital Circuits", faculty: "Dr. Alpana Aggarwal", totalClasses: 32, attendedClasses: 26, credits: 3.5 },
      { id: "sub-304", code: "UMA011", name: "Numerical Analysis & Complex Variables", faculty: "Dr. Meenakshi", totalClasses: 28, attendedClasses: 20, credits: 3.5 },
      { id: "sub-305", code: "UTA025", name: "Engineering Design Project - II", faculty: "Dr. Ashutosh Mishra", totalClasses: 24, attendedClasses: 22, credits: 2.5 }
    ],
    4: [
      { id: "sub-1", code: "UCS415", name: "Design & Analysis of Algorithms", faculty: "Dr. Rajesh Kumar", totalClasses: 32, attendedClasses: 28, credits: 4.0 },
      { id: "sub-2", code: "UCS303", name: "Operating Systems", faculty: "Dr. Neha Garg", totalClasses: 30, attendedClasses: 22, credits: 3.5 },
      { id: "sub-3", code: "UCS405", name: "Discrete Mathematical Structures", faculty: "Dr. Amit Verma", totalClasses: 28, attendedClasses: 20, credits: 3.5 },
      { id: "sub-4", code: "UTA018", name: "Object Oriented Programming (C++)", faculty: "Dr. Seema Bawa", totalClasses: 36, attendedClasses: 31, credits: 4.0 },
      { id: "sub-5", code: "UHU003", name: "Professional Communication", faculty: "Prof. Sonia Sharma", totalClasses: 24, attendedClasses: 17, credits: 2.0 },
      { id: "sub-6", code: "UCS414", name: "Computer Networks & Security", faculty: "Dr. Harpreet Singh", totalClasses: 26, attendedClasses: 18, credits: 3.5 }
    ],
    5: [
      { id: "sub-501", code: "UCS503", name: "Software Engineering & Agile Methodologies", faculty: "Dr. Inderveer Chana", totalClasses: 34, attendedClasses: 30, credits: 4.0 },
      { id: "sub-502", code: "UCS505", name: "Computer Architecture & Organization", faculty: "Dr. Maninder Singh", totalClasses: 32, attendedClasses: 25, credits: 3.5 },
      { id: "sub-503", code: "UCS510", name: "Database Management Systems (DBMS)", faculty: "Dr. Prashant Singh", totalClasses: 36, attendedClasses: 31, credits: 4.0 },
      { id: "sub-504", code: "UCS512", name: "Theory of Computation & Automata", faculty: "Dr. Vinay Arora", totalClasses: 30, attendedClasses: 22, credits: 3.5 },
      { id: "sub-505", code: "UCS515", name: "Web Technologies & Cloud Applications", faculty: "Dr. Parteek Kumar", totalClasses: 28, attendedClasses: 24, credits: 3.0 }
    ],
    6: [
      { id: "sub-601", code: "UCS608", name: "Compiler Construction & Design", faculty: "Dr. R. K. Sharma", totalClasses: 32, attendedClasses: 28, credits: 3.5 },
      { id: "sub-602", code: "UCS616", name: "Machine Learning & Pattern Recognition", faculty: "Dr. Shivani Goel", totalClasses: 36, attendedClasses: 31, credits: 4.0 },
      { id: "sub-603", code: "UCS614", name: "Cloud Computing & Distributed Systems", faculty: "Dr. Avinash Sharma", totalClasses: 30, attendedClasses: 25, credits: 3.5 },
      { id: "sub-604", code: "UCS617", name: "Cryptography & Network Security", faculty: "Dr. Hemraj Saini", totalClasses: 28, attendedClasses: 21, credits: 3.5 },
      { id: "sub-605", code: "UTA026", name: "Capstone Project (Phase - I)", faculty: "Prof. Project Head", totalClasses: 20, attendedClasses: 19, credits: 3.0 }
    ],
    7: [
      { id: "sub-701", code: "UCS701", name: "Artificial Intelligence & Deep Learning", faculty: "Dr. Deepak Garg", totalClasses: 34, attendedClasses: 30, credits: 4.0 },
      { id: "sub-702", code: "UCS704", name: "DevOps & Microservices Architecture", faculty: "Dr. Rohit Saxena", totalClasses: 30, attendedClasses: 26, credits: 3.5 },
      { id: "sub-703", code: "UCS742", name: "Big Data Analytics & Spark", faculty: "Dr. Anju Bala", totalClasses: 28, attendedClasses: 22, credits: 3.5 },
      { id: "sub-704", code: "UCS794", name: "Capstone Project (Phase - II)", faculty: "Department Committee", totalClasses: 24, attendedClasses: 23, credits: 4.0 },
      { id: "sub-705", code: "UHU008", name: "Engineering Economics & Management", faculty: "Dr. Ravi Kiran", totalClasses: 24, attendedClasses: 19, credits: 2.0 }
    ],
    8: [
      { id: "sub-801", code: "UCS802", name: "Industry Internship / Project Semester", faculty: "TIET Placement & TPO", totalClasses: 40, attendedClasses: 38, credits: 16.0 },
      { id: "sub-802", code: "UCS803", name: "System Design & Large Scale Scalability", faculty: "Dr. Maninder Singh", totalClasses: 28, attendedClasses: 24, credits: 4.0 }
    ]
  },

  // Subjects & Attendance Preset (defaults to current semester)
  attendanceSubjects: [
    { id: "sub-1", code: "UCS415", name: "Design & Analysis of Algorithms", faculty: "Dr. Rajesh Kumar", totalClasses: 32, attendedClasses: 28, credits: 4.0 },
    { id: "sub-2", code: "UCS303", name: "Operating Systems", faculty: "Dr. Neha Garg", totalClasses: 30, attendedClasses: 22, credits: 3.5 },
    { id: "sub-3", code: "UCS405", name: "Discrete Mathematical Structures", faculty: "Dr. Amit Verma", totalClasses: 28, attendedClasses: 20, credits: 3.5 },
    { id: "sub-4", code: "UTA018", name: "Object Oriented Programming (C++)", faculty: "Dr. Seema Bawa", totalClasses: 36, attendedClasses: 31, credits: 4.0 },
    { id: "sub-5", code: "UHU003", name: "Professional Communication", faculty: "Prof. Sonia Sharma", totalClasses: 24, attendedClasses: 17, credits: 2.0 },
    { id: "sub-6", code: "UCS414", name: "Computer Networks & Security", faculty: "Dr. Harpreet Singh", totalClasses: 26, attendedClasses: 18, credits: 3.5 }
  ],

  // Rideshare Cab Pool Listings
  rideshares: [
    {
      id: "ride-1",
      creatorName: "Kabir Malhotra",
      creatorRoll: "102103890",
      creatorPhone: "9876543210",
      fromLocation: "Hostel J / Gate 1",
      toLocation: "Rajpura Railway Station",
      date: "2026-08-23",
      departureTime: "04:30 PM",
      totalSeats: 4,
      seatsAvailable: 2,
      estimatedFareTotal: 700,
      farePerHead: 175,
      luggageAllowed: "Medium Suitcase + Backpack",
      femaleOnly: false,
      notes: "Catching Vande Bharat Express to Delhi at 5:45 PM. AC Cab booked via Uber XL."
    },
    {
      id: "ride-2",
      creatorName: "Simran Kaur",
      creatorRoll: "102315022",
      creatorPhone: "9812345678",
      fromLocation: "Hostel E (Girls Hostel)",
      toLocation: "Chandigarh Airport (IXC)",
      date: "2026-08-24",
      departureTime: "08:00 AM",
      totalSeats: 4,
      seatsAvailable: 3,
      estimatedFareTotal: 1400,
      farePerHead: 350,
      luggageAllowed: "1 Large Bag + Handbag",
      femaleOnly: true,
      notes: "Indigo Flight 6E-243 at 11:30 AM. Safe driver, female co-passengers only please!"
    },
    {
      id: "ride-3",
      creatorName: "Rohan Singla",
      creatorRoll: "102208112",
      creatorPhone: "9988776655",
      fromLocation: "Gate 2 (Nirvana Side)",
      toLocation: "Elante Mall, Chandigarh",
      date: "2026-08-23",
      departureTime: "01:30 PM",
      totalSeats: 4,
      seatsAvailable: 1,
      estimatedFareTotal: 1200,
      farePerHead: 300,
      luggageAllowed: "Backpack Only",
      femaleOnly: false,
      notes: "Saturday hangout with friends. Returning by 9:00 PM (same cab split if interested)."
    },
    {
      id: "ride-4",
      creatorName: "Ananya Gupta",
      creatorRoll: "102203119",
      creatorPhone: "9776655443",
      fromLocation: "Hostel I / Library Circle",
      toLocation: "Delhi Kashmere Gate ISBT",
      date: "2026-08-28",
      departureTime: "06:00 AM",
      totalSeats: 4,
      seatsAvailable: 2,
      estimatedFareTotal: 3200,
      farePerHead: 800,
      luggageAllowed: "1 Heavy Trolley",
      femaleOnly: false,
      notes: "Long weekend break! Direct Ertiga cab booked from Patiala to Delhi."
    }
  ],

  // Mess Menus by Hostel and Day
  messMenus: {
    "Hostel J": {
      "Monday": {
        breakfast: ["Aloo Pyaz Paratha (2 pcs)", "Fresh Curd & Pickle", "Boiled Eggs / Sprouts", "Tea & Coffee", "Bread Butter Jam"],
        lunch: ["Rajma Masala (Punjabi Style)", "Jeera Rice", "Aloo Gobi Dry", "Tandoori Roti", "Boondi Raita", "Green Salad"],
        snacks: ["Crispy Samosa (1 pc)", "Mint & Imli Chutney", "Hot Adrak Chai"],
        dinner: ["Kadai Paneer", "Dal Makhani", "Steamed Rice", "Butter Naan / Roti", "Gulab Jamun (Warm)"]
      },
      "Tuesday": {
        breakfast: ["Idli & Medu Vada", "Coconut Chutney", "Hot Vegetable Sambar", "Tea & Coffee", "Fresh Banana"],
        lunch: ["Kadhi Pakoda", "Steamed Rice", "Bhindi Do Pyaza", "Fresh Phulka", "Cucumber Raita", "Papad"],
        snacks: ["Veg Cutlet (2 pcs)", "Tomato Ketchup", "Hot Masala Chai"],
        dinner: ["Egg Curry / Shahi Paneer", "Yellow Dal Tadka", "Peas Pulao", "Tawa Roti", "Rice Kheer"]
      },
      "Wednesday": {
        breakfast: ["Poha with Peanuts & Sev", "Boiled Eggs / Fruits", "Bread Omelette / Jam", "Cutting Chai / Milk"],
        lunch: ["Chole Masala (Amritsari)", "Bhature / Poori", "Jeera Rice", "Boondi Raita", "Pickled Onions"],
        snacks: ["Bread Pakoda (1 pc)", "Green Chutney", "Special Chai"],
        dinner: ["Mix Veg Handi", "Dal Tadka", "Steamed Rice", "Phulka Roti", "Ice Cream Cup"]
      },
      "Thursday": {
        breakfast: ["Gobhi Paratha with Butter", "Curd & Pickle", "Cornflakes with Milk", "Hot Tea / Coffee"],
        lunch: ["Black Chana Masala", "Aloo Capsicum", "Steamed Rice", "Roti", "Mix Raita", "Salad"],
        snacks: ["Pav Bhaji (2 Pav)", "Butter Pav", "Cardamom Tea"],
        dinner: ["Paneer Butter Masala", "Dal Fry", "Jeera Rice", "Butter Roti", "Rasgulla"]
      },
      "Friday": {
        breakfast: ["Uttapam (Onion/Tomato)", "Coconut Chutney & Sambar", "Sprouts Salad", "Tea & Coffee"],
        lunch: ["Dal Makhani (Slow cooked)", "Shahi Paneer", "Dum Aloo Kashmiri", "Jeera Rice", "Naan / Phulka", "Raita"],
        snacks: ["Maggi Noodles / Macaroni", "Tomato Sauce", "Hot Ginger Tea"],
        dinner: ["Veg Biryani with Salan", "Paneer Tikka Gravy", "Raita", "Roti", "Moong Dal Halwa"]
      },
      "Saturday": {
        breakfast: ["Methi Thepla / Paratha", "Aloo Sabzi", "Curd & Pickle", "Tea / Bournvita"],
        lunch: ["Lauki Kofta", "Yellow Moong Dal", "Steamed Rice", "Phulka", "Pineapple Raita"],
        snacks: ["Aloo Tikki Chaat", "Dahi & Chutneys", "Tea"],
        dinner: ["Chicken Curry (For Non-Veg) / Paneer Lababdar", "Dal Tadka", "Rice", "Roti", "Custard Fruit Jelly"]
      },
      "Sunday": {
        breakfast: ["Special Chole Bhature (Unlimited)", "Sweet Lassi / Tea", "Fresh Papaya"],
        lunch: ["Veg Pulao", "Boondi Raita", "Soya Chaap Gravy", "Phulka", "Papad & Salad"],
        snacks: ["Biscuit & Cookies Platter", "Filter Coffee / Milk Tea"],
        dinner: ["Special Sunday Feast: Paneer Pasanda", "Dal Bukhara", "Kashmiri Pulao", "Butter Naan", "Jalebi with Rabri"]
      }
    },
    "Hostel M": {
      "Monday": {
        breakfast: ["Paneer Paratha (2 pcs)", "Curd & Pickle", "Boiled Eggs", "Tea / Coffee"],
        lunch: ["Dal Makhani", "Jeera Rice", "Mix Veg", "Roti", "Boondi Raita"],
        snacks: ["Veg Sandwich (Grilled)", "Hot Tea"],
        dinner: ["Matar Paneer", "Yellow Dal", "Rice", "Phulka", "Gulab Jamun"]
      },
      "Tuesday": {
        breakfast: ["Poha with Sprouts", "Boiled Eggs", "Bread Toast", "Hot Chai"],
        lunch: ["Rajma Masala", "Steamed Rice", "Aloo Jeera", "Roti", "Curd"],
        snacks: ["Samosa with Mint Chutney", "Chai"],
        dinner: ["Egg Curry / Paneer Bhurji", "Dal Tadka", "Jeera Rice", "Tawa Roti", "Custard"]
      }
    },
    "Hostel H": {
      "Monday": {
        breakfast: ["Aloo Paratha with White Butter", "Curd", "Sprouts", "Tea & Coffee"],
        lunch: ["Amritsari Chole", "Jeera Rice", "Aloo Shimlamirch", "Roti", "Raita"],
        snacks: ["French Fries & Tea", "Ketchup"],
        dinner: ["Kadai Paneer", "Dal Makhani", "Pulao", "Naan / Roti", "Moong Dal Halwa"]
      }
    },
    "Hostel E (Girls)": {
      "Monday": {
        breakfast: ["Paneer Onion Paratha", "Amul Curd", "Fresh Cut Fruits", "Tea / Green Tea"],
        lunch: ["Dal Makhani", "Steamed Basmati Rice", "Bhindi Masala", "Phulka", "Cucumber Raita"],
        snacks: ["Red Sauce Pasta", "Hot Masala Chai"],
        dinner: ["Shahi Paneer", "Arhar Dal Tadka", "Jeera Rice", "Butter Roti", "Hot Brownie with Fudge"]
      }
    }
  },

  // Food Spots & Hangouts (COS, G-Block, Nirvana, Jaggi)
  foodSpots: [
    {
      id: "spot-1",
      name: "COS (Center of Studies) Food Kiosks",
      location: "Central Campus Near Library",
      famousFor: "Rolls Nation, Nescafe Frappe, Waffles, SubHub",
      timings: "9:00 AM - 1:00 AM",
      crowdLevel: "Moderate (10 min wait)",
      deliveryNumber: "+91 98721 00112",
      rating: 4.6
    },
    {
      id: "spot-2",
      name: "Nirvana Food Court",
      location: "Near Gate 2 / Hostel PG",
      famousFor: "Butter Chicken, Shawarma, Chai Nagri, Dosa Planet",
      timings: "11:00 AM - 2:30 AM (Late Night)",
      crowdLevel: "High (Peak hours 9 PM - 12 AM)",
      deliveryNumber: "+91 98721 55667",
      rating: 4.8
    },
    {
      id: "spot-3",
      name: "G-Block Canteen & Juice Bar",
      location: "G-Block Academic Complex",
      famousFor: "Fresh Mosambi Juice, Grilled Cheese Sandwiches, Cold Coffee",
      timings: "8:30 AM - 6:00 PM",
      crowdLevel: "High between 12:45 PM - 1:45 PM (Class change)",
      deliveryNumber: "+91 98721 88990",
      rating: 4.4
    },
    {
      id: "spot-4",
      name: "Jaggi Sweet Shop & Fast Food",
      location: "Just outside Thapar Gate 1",
      famousFor: "Authentic Patiala Lassi, Chole Kulche, Desi Ghee Jalebi",
      timings: "8:00 AM - 11:00 PM",
      crowdLevel: "Moderate",
      deliveryNumber: "+91 98721 33441",
      rating: 4.7
    }
  ],

  // Academic PYQs & Study Vault
  academicVault: [
    {
      id: "pyq-1",
      courseCode: "UCS415",
      title: "Design & Analysis of Algorithms - EST 2025 Solved",
      type: "EST",
      branch: "COE/COPC",
      semester: 4,
      year: "2025",
      fileSize: "3.4 MB",
      uploader: "Aniket (COE '24 Topper)",
      rating: 4.9,
      downloads: 480,
      tags: ["Dynamic Programming", "Greedy", "Graph Algorithms", "NP-Complete"]
    },
    {
      id: "pyq-2",
      courseCode: "UCS303",
      title: "Operating Systems - MST 1 & MST 2 Collection",
      type: "MST",
      branch: "COE/COPC",
      semester: 4,
      year: "2024",
      fileSize: "2.1 MB",
      uploader: "TIET Coding Club Vault",
      rating: 4.8,
      downloads: 620,
      tags: ["Process Scheduling", "Semaphores", "Deadlocks", "Paging"]
    },
    {
      id: "pyq-3",
      courseCode: "UTA018",
      title: "OOP in C++ Handwritten Topper Notes & Lab Solutions",
      type: "Notes",
      branch: "All 1st/2nd Year",
      semester: 2,
      year: "2025",
      fileSize: "5.8 MB",
      uploader: "Priya S. (CGPA 9.8)",
      rating: 5.0,
      downloads: 1250,
      tags: ["Polymorphism", "Virtual Functions", "Templates", "STL Vectors"]
    },
    {
      id: "pyq-4",
      courseCode: "UMA010",
      title: "Mathematics-I (Calculus & Linear Algebra) Past 5 Year Papers",
      type: "EST",
      branch: "All Branches (1st Sem)",
      semester: 1,
      year: "2020-2025",
      fileSize: "7.2 MB",
      uploader: "Maths Society TIET",
      rating: 4.9,
      downloads: 2100,
      tags: ["Eigen Values", "Taylor Series", "Multiple Integrals", "Rank of Matrix"]
    },
    {
      id: "pyq-5",
      courseCode: "UEE001",
      title: "Electrical & Electronics Engineering Formula Cheat Sheet",
      type: "Notes",
      branch: "1st Year Common",
      semester: 1,
      year: "2025",
      fileSize: "1.9 MB",
      uploader: "IEEE Student Chapter",
      rating: 4.7,
      downloads: 890,
      tags: ["Thevenin Theorem", "AC Circuits", "Transformers", "Diode Rectifiers"]
    },
    {
      id: "pyq-6",
      courseCode: "UCS405",
      title: "Discrete Mathematical Structures MST Solved Paper",
      type: "MST",
      branch: "COE/COPC/ENC",
      semester: 3,
      year: "2024",
      fileSize: "2.6 MB",
      uploader: "Aryan K.",
      rating: 4.6,
      downloads: 410,
      tags: ["Recurrence Relations", "Pigeonhole Principle", "Tree Traversals"]
    }
  ],

  // Campus Marketplace & Lost & Found
  marketplaceItems: [
    {
      id: "item-1",
      title: "Hero Sprint Pro 21-Speed Gear Bicycle",
      category: "Bicycles",
      price: 3400,
      originalPrice: 7500,
      condition: "Great (Serviced last month)",
      sellerName: "Tanmay Verma",
      sellerHostel: "Hostel J - Room 412",
      sellerPhone: "9876541230",
      description: "Smooth ride for travelling between Hostel J and G-Block / COS. Front suspension + bottle holder + strong number lock included.",
      postedDate: "2 days ago",
      iconEmoji: "🚲"
    },
    {
      id: "item-2",
      title: "Omega Engineering Drafter + T-Scale + Tube Container",
      category: "Engineering Tools",
      price: 450,
      originalPrice: 1100,
      condition: "Like New (Used for 1 sem only)",
      sellerName: "Divyansh Mehra",
      sellerHostel: "Hostel M - Room 204",
      sellerPhone: "9812349900",
      description: "Mandatory for 1st Year Engineering Drawing (ED) in C-Hall. Calibration is 100% accurate, zero scratches.",
      postedDate: "Yesterday",
      iconEmoji: "📐"
    },
    {
      id: "item-3",
      title: "Havells 1.2L Electric Kettle (Hostel Approved)",
      category: "Room Appliances",
      price: 650,
      originalPrice: 1499,
      condition: "Working Perfectly",
      sellerName: "Ritika Sethi",
      sellerHostel: "Hostel E - Room 118",
      sellerPhone: "9898981234",
      description: "Lifesaver during late night MST exams for making Maggi, green tea, and coffee. Auto-cutoff feature works.",
      postedDate: "3 days ago",
      iconEmoji: "🫖"
    },
    {
      id: "item-4",
      title: "White Chemistry Lab Coat (Size L, TIET Verified)",
      category: "Apparel & Books",
      price: 200,
      originalPrice: 450,
      condition: "Clean & Washed",
      sellerName: "Kunal Jha",
      sellerHostel: "Hostel H - Room 310",
      sellerPhone: "9765432109",
      description: "Clean lab coat with TIET logo pocket. No chemical stains.",
      postedDate: "Today",
      iconEmoji: "🥼"
    },
    {
      id: "item-5",
      title: "Bajaj Personal Room Desert Cooler 24L",
      category: "Room Appliances",
      price: 1800,
      originalPrice: 4200,
      condition: "Good Cooling (Honeycomb pads)",
      sellerName: "Sahil Arora",
      sellerHostel: "Hostel J - Room 102",
      sellerPhone: "9887766554",
      description: "Very effective cooling for Hostel non-AC rooms. Silent motor and castor wheels.",
      postedDate: "4 days ago",
      iconEmoji: "❄️"
    }
  ],

  // Lost & Found Items
  lostAndFound: [
    {
      id: "lf-1",
      type: "Found",
      title: "Boat Airdopes 141 (Black Case)",
      location: "Central Library - 2nd Floor Reading Hall",
      date: "2026-08-21",
      contactPerson: "Library Front Helpdesk / Ishan",
      status: "Unclaimed",
      details: "Left near table #14 next to the charging port. Collect by showing Bluetooth pairing on your phone."
    },
    {
      id: "lf-2",
      type: "Lost",
      title: "Casio fx-991EX ClassWiz Calculator",
      location: "LP-104 (Lecture Hall)",
      date: "2026-08-20",
      contactPerson: "Rahul (Hostel M - 9876500112)",
      status: "Lost",
      details: "Has a small Batman sticker on the slide cover. Very important for upcoming MST. Reward offered!"
    },
    {
      id: "lf-3",
      type: "Found",
      title: "Hostel Cycle Lock Keys (Set of 2 on Adidas Lanyard)",
      location: "COS Food Court Bench",
      date: "2026-08-22",
      contactPerson: "Hostel J Caretaker Office",
      status: "Unclaimed",
      details: "Handed over to Hostel J Caretaker. Blue keychain ring."
    }
  ],

  // Societies & Campus Events Radar
  societies: [
    {
      id: "soc-1",
      name: "Creative Computing Society (CCS)",
      shortName: "CCS TIET",
      category: "Technical / Coding",
      logoEmoji: "💻",
      description: "TIET's premier coding and software development society. Organizers of HackTU, CodeWars, and developer bootcamps.",
      recruitmentStatus: "Open (Round 2 Ongoing)",
      deadline: "2026-08-25",
      roles: ["Web Dev", "App Dev", "UI/UX Design", "Competitive Programming", "Corporate Relations"],
      instaHandle: "@ccstiet",
      registrationLink: "https://ccs-tiet.org/recruitments"
    },
    {
      id: "soc-2",
      name: "OWASP Student Chapter TIET",
      shortName: "OWASP TIET",
      category: "Cybersecurity & Web Dev",
      logoEmoji: "🛡️",
      description: "Dedicated to cybersecurity, CTFs, ethical hacking, and open source development.",
      recruitmentStatus: "Upcoming (Starts Monday)",
      deadline: "2026-08-29",
      roles: ["Cybersecurity / CTF", "Fullstack Dev", "Graphic Design", "Content & PR"],
      instaHandle: "@owasptiet",
      registrationLink: "https://owasptiet.com/apply"
    },
    {
      id: "soc-3",
      name: "Microsoft Learn Student Chapter (MLSC)",
      shortName: "MLSC TIET",
      category: "AI / Cloud & Tech",
      logoEmoji: "🚀",
      description: "Empowering developers through Azure workshops, Make4Thapar Hackathon, and AI/ML project cohorts.",
      recruitmentStatus: "Open (Round 1 Registrations)",
      deadline: "2026-08-26",
      roles: ["AI/ML Research", "Cloud & DevOps", "Event Management", "Sponsorships"],
      instaHandle: "@mlsctiet",
      registrationLink: "https://mlsctiet.com"
    },
    {
      id: "soc-4",
      name: "Frosh TIET",
      shortName: "FROSH",
      category: "Student Induction & Mega Events",
      logoEmoji: "🎉",
      description: "The official induction body of Thapar University responsible for Freshers week, Orientations, and flagship campus vibes.",
      recruitmentStatus: "Interviews Active",
      deadline: "2026-08-24",
      roles: ["Anchoring & Drama", "Stage & Production", "Logistics", "Photography & Video Editing"],
      instaHandle: "@froshtiet",
      registrationLink: "https://frosh-tiet.in"
    },
    {
      id: "soc-5",
      name: "EDC - Entrepreneurship Development Cell",
      shortName: "EDC TIET",
      category: "Startups & E-Summit",
      logoEmoji: "💡",
      description: "Incubating student startups, VC pitch competitions, and hosting North India's largest E-Summit.",
      recruitmentStatus: "Open",
      deadline: "2026-08-27",
      roles: ["Startup Incubator Mentors", "Marketing", "Sponsorship & PR"],
      instaHandle: "@edctiet",
      registrationLink: "https://edctiet.com"
    },
    {
      id: "soc-6",
      name: "Saturnalia & Urja Core Committees",
      shortName: "Fest Core",
      category: "Cultural & Sports Fest",
      logoEmoji: "🌟",
      description: "Organizing Saturnalia (North India's largest cultural fest) and Urja (Inter-college sports battle).",
      recruitmentStatus: "Call for Volunteers",
      deadline: "2026-09-02",
      roles: ["Celebrity Management", "Hospitality", "Security & Crowd Control", "Creative Decor"],
      instaHandle: "@saturnalia_tiet",
      registrationLink: "https://saturnalia-tiet.com"
    }
  ],

  // Anonymous Campus Feed & Placement / Hostel Advice
  feedPosts: [
    {
      id: "post-1",
      authorAlias: "TIET Senior 4th Year (Placed @ Microsoft)",
      branch: "COPC '26",
      tag: "Placement Prep",
      content: "For anyone sitting for placements in 7th sem: Don't stress too much over minor CGPA differences once you are above 8.0. Focus intensely on DSA (LeetCode Blind 75), OS concurrency questions, and 1 solid full-stack project where you actually understand the architecture. Also attend the mock interviews organized by CCS/MLSC.",
      timestamp: "3 hours ago",
      upvotes: 84,
      comments: [
        { author: "Hostel J Fresher", text: "How important is CP vs Dev for Day 1 companies?" },
        { author: "TIET Senior 4th Year", text: "CP gets your resume shortlisted and clears OT (Online Test). Dev is what makes you shine in technical rounds!" }
      ]
    },
    {
      id: "post-2",
      authorAlias: "Hostel J Resident",
      branch: "COE '28",
      tag: "Hostel Banter",
      content: "Can we all agree that Friday's Slow Cooked Dal Makhani and Naan at Hostel J mess is the only thing keeping our sanity intact before 8 AM Saturday labs?",
      timestamp: "5 hours ago",
      upvotes: 142,
      comments: [
        { author: "Hostel M Guy", text: "Hostel M mess would never 😭 we get yellow dal" },
        { author: "Hostel E Girl", text: "Girls hostel Friday brownie says hello 🍫" }
      ]
    },
    {
      id: "post-3",
      authorAlias: "MST Survivor",
      branch: "ENC '27",
      tag: "Academic Advice",
      content: "PSA for UMA010 (Maths-I): Do NOT ignore the tutorial sheets. 70% of the MST questions are direct variations of Tutorial #3 and #4. Past papers on ThaparPulse Vault have the full solutions.",
      timestamp: "1 day ago",
      upvotes: 98,
      comments: [
        { author: "Fresher 2026", text: "Saved my life, thank you!" }
      ]
    },
    {
      id: "post-4",
      authorAlias: "Night Owl",
      branch: "ME '27",
      tag: "Campus Life",
      content: "If you need a quiet spot to study past 11 PM with high-speed Wi-Fi and AC, Central Library 1st floor night reading section is open till 2 AM before exam week. Make sure to bring your TIET ID card.",
      timestamp: "2 days ago",
      upvotes: 56,
      comments: []
    }
  ]
};

// Export to window for vanilla JS access
window.THAPAR_DATA = THAPAR_DATA;
