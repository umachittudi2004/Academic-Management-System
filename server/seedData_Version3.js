// import mongoose from 'mongoose'
// import { Faculty } from './models/faculty.model.js'
// import { Subject } from './models/subject.model.js'
// import { Student } from './models/student.model.js'
// import dotenv from 'dotenv'
// dotenv.config()

// // ========== CONFIGURATION ==========
// const MONGO_URI = process.env.MONGO_URL
// const CURRENT_YEAR = 2025
// // ===================================

// const BRANCHES = {
//   '05': { code: '05', name: 'CSE', fullName: 'Computer Science Engineering' },
//   '44': { code: '44', name: 'CSE-DS', fullName: 'CSE - Data Science' },
//   '04': { code: '04', name: 'ECE', fullName: 'Electronics & Communication' },
//   '02': { code: '02', name: 'EEE', fullName: 'Electrical & Electronics' }
// }

// const SECTIONS = ['A', 'B']
// const YEARS = [1, 2, 3, 4]
// const COLLEGE_CODE = 'P3'

// // Calculate joining year for a given academic year
// function calculateJoiningYear(currentYear, academicYear, isLateral = false) {
//   return isLateral ? currentYear - (academicYear - 2) : currentYear - (academicYear - 1)
// }

// // Calculate current academic year from roll number
// function calculateCurrentAcademicYear(rollno, currentYear) {
//   const joiningYearShort = rollno.substring(0, 2)
//   const joiningYear = parseInt('20' + joiningYearShort)
//   const isLateral = rollno.substring(4, 5) === '5'
//   const yearsPassed = currentYear - joiningYear
//   const currentAcademicYear = isLateral ? 2 + yearsPassed : 1 + yearsPassed
//   return Math.min(Math.max(currentAcademicYear, 1), 4)
// }

// function generateRollNumber(year, branchCode, section, serialNum, isLateral = false) {
//   const yearPrefix = year.toString().slice(-2)
//   const entryType = isLateral ? '5' : '1'
//   let serialStr
//   if (serialNum <= 99) {
//     serialStr = serialNum.toString().padStart(2, '0')
//   } else {
//     const letterIndex = Math.floor((serialNum - 100) / 10)
//     const digitIndex = (serialNum - 100) % 10
//     const letter = String.fromCharCode(65 + letterIndex)
//     serialStr = `${letter}${digitIndex}`
//   }
//   return `${yearPrefix}${COLLEGE_CODE}${entryType}A${branchCode}${serialStr}`
// }

// function generateEmail(rollno) {
//   return `${rollno.toLowerCase()}@acet.ac.in`
// }

// const firstNames = [
//   'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Karthik', 'Divya',
//   'Rohan', 'Meera', 'Arjun', 'Pooja', 'Sanjay', 'Kavya', 'Nikhil', 'Riya',
//   'Aditya', 'Shreya', 'Varun', 'Nisha', 'Manish', 'Swati', 'Suresh', 'Ananya',
//   'Praveen', 'Deepika', 'Rajesh', 'Lakshmi', 'Harish', 'Vani', 'Krishna', 'Sahana',
//   'Naveen', 'Bhavana', 'Ganesh', 'Pavitra', 'Mahesh', 'Soundarya', 'Ramesh', 'Srilatha',
//   'Venkat', 'Madhuri', 'Sunil', 'Rekha', 'Prakash', 'Uma', 'Santosh', 'Radha',
//   'Mohan', 'Sushma', 'Gopal', 'Lavanya', 'Ravi', 'Sailaja', 'Anil', 'Vasudha',
//   'Bhaskar', 'Shruthi', 'Charan', 'Mythili', 'Dinesh', 'Padma', 'Eswar', 'Tejasvi',
//   'Farhan', 'Zoya', 'Imran', 'Ayesha', 'Sameer', 'Nazia', 'Adnan', 'Sana'
// ]

// const lastNames = [
//   'Kumar', 'Reddy', 'Sharma', 'Rao', 'Patel', 'Singh', 'Gupta', 'Nair',
//   'Iyer', 'Verma', 'Agarwal', 'Joshi', 'Desai', 'Malhotra', 'Chopra', 'Kapoor',
//   'Mehta', 'Kulkarni', 'Naidu', 'Chowdhury', 'Shetty', 'Menon', 'Pillai', 'Khan'
// ]

// function generateName() {
//   const first = firstNames[Math.floor(Math.random() * firstNames.length)]
//   const last = lastNames[Math.floor(Math.random() * lastNames.length)]
//   return `${first} ${last}`
// }

// const facultyNames = [
//   'Dr. Venkatesh Kumar', 'Prof. Lakshmi Devi', 'Dr. Rajendra Prasad', 'Prof. Madhavi Latha',
//   'Dr. Srinivas Rao', 'Prof. Sailaja Reddy', 'Dr. Ramesh Babu', 'Prof. Kavitha Sharma',
//   'Dr. Suresh Kumar', 'Prof. Anitha Rao', 'Dr. Prasad Reddy', 'Prof. Sowjanya Devi',
//   'Dr. Narayana Swamy', 'Prof. Padmavathi', 'Dr. Kiran Kumar'
// ]

// const subjectsByYear = {
//   1: [
//     { name: 'Engineering Mathematics-I', code: 'MA101' },
//     { name: 'Engineering Physics', code: 'PH101' },
//     { name: 'Engineering Chemistry', code: 'CH101' },
//     { name: 'Programming for Problem Solving', code: 'CS101' },
//     { name: 'Engineering Graphics', code: 'ME101' }
//   ],
//   2: [
//     { name: 'Engineering Mathematics-II', code: 'MA201' },
//     { name: 'Data Structures', code: 'CS201' },
//     { name: 'Digital Logic Design', code: 'EC201' },
//     { name: 'Object Oriented Programming', code: 'CS202' },
//     { name: 'Computer Organization', code: 'CS203' }
//   ],
//   3: [
//     { name: 'Database Management Systems', code: 'CS301' },
//     { name: 'Operating Systems', code: 'CS302' },
//     { name: 'Computer Networks', code: 'CS303' },
//     { name: 'Software Engineering', code: 'CS304' },
//     { name: 'Web Technologies', code: 'CS305' }
//   ],
//   4: [
//     { name: 'Machine Learning', code: 'CS401' },
//     { name: 'Artificial Intelligence', code: 'CS402' },
//     { name: 'Cloud Computing', code: 'CS403' },
//     { name: 'Cyber Security', code: 'CS404' },
//     { name: 'Big Data Analytics', code: 'CS405' }
//   ]
// }

// async function seedDatabase() {
//   try {
//     console.log('🔄 Starting database seed...\n')
//     console.log(`📅 Current Year: ${CURRENT_YEAR}`)
//     console.log(`📅 Academic Year: ${CURRENT_YEAR}-${CURRENT_YEAR + 1}\n`)

//     await mongoose.connect(MONGO_URI)
//     console.log('✅ Connected to MongoDB')

//     await Faculty.deleteMany({})
//     await Subject.deleteMany({})
//     await Student.deleteMany({})
//     console.log('🗑️  Cleared existing data\n')

//     // Faculties
//     const faculties = []
//     for (let i = 0; i < 15; i++) {
//       const branch = Object.values(BRANCHES)[i % 4]
//       faculties.push({
//         _id: new mongoose.Types.ObjectId(),
//         empId: `EMP${(10001 + i).toString()}`,
//         name: facultyNames[i],
//         branch: branch.name,
//         password: `faculty${i + 1}`,
//         isHashed: false,
//         img: '',
//         sessionId: null,
//         subjects: []
//       })
//     }

//     const insertedFaculties = await Faculty.insertMany(faculties)
//     console.log(`✅ Created ${insertedFaculties.length} faculties`)

//     // Subjects
//     const subjects = []
//     let facultyIndex = 0
//     for (const year of YEARS) {
//       for (const section of SECTIONS) {
//         for (const branch of Object.values(BRANCHES)) {
//           for (const subjectInfo of subjectsByYear[year]) {
//             const facultyId = insertedFaculties[facultyIndex % insertedFaculties.length]._id
//             subjects.push({
//               _id: new mongoose.Types.ObjectId(),
//               subjectName: subjectInfo.name,
//               subjectCode: `${subjectInfo.code}-Y${year}-${branch.code}-${section}`,
//               year: year,
//               section: section,
//               branch: branch.name,
//               faculty: facultyId
//             })
//             facultyIndex++
//           }
//         }
//       }
//     }

//     const insertedSubjects = await Subject.insertMany(subjects)
//     console.log(`✅ Created ${insertedSubjects.length} subjects`)

//     // Link subjects to faculties
//     for (const faculty of insertedFaculties) {
//       const assignedSubjects = insertedSubjects
//         .filter(s => s.faculty.toString() === faculty._id.toString())
//         .map(s => s._id)
//       await Faculty.findByIdAndUpdate(faculty._id, { subjects: assignedSubjects })
//     }
//     console.log('✅ Updated faculties with subject references\n')

//     // Students
//     const students = []
//     const studentsByYearType = { 1: { regular: 0, lateral: 0 }, 2: { regular: 0, lateral: 0 }, 3: { regular: 0, lateral: 0 }, 4: { regular: 0, lateral: 0 } }

//     for (const year of YEARS) {
//       for (const section of SECTIONS) {
//         for (const branch of Object.values(BRANCHES)) {
//           const regularJoiningYear = calculateJoiningYear(CURRENT_YEAR, year, false)
//           for (let i = 1; i <= 70; i++) {
//             const rollno = generateRollNumber(regularJoiningYear, branch.code, section, i, false)
//             const currentYear = calculateCurrentAcademicYear(rollno, CURRENT_YEAR)
//             students.push({
//               _id: new mongoose.Types.ObjectId(),
//               rollno,
//               name: generateName(),
//               branch: branch.name,
//               section,
//               college: 'ACET',
//               password: rollno,
//               isHashed: false,
//               img: '',
//               status: 'active',
//               phoneno: `${8000000000 + Math.floor(Math.random() * 999999999)}`,
//               year: currentYear,
//               transport: Math.random() > 0.5 ? 'Bus' : 'Own',
//               fatherName: generateName(),
//               motherName: generateName(),
//               email: generateEmail(rollno),
//               sessionId: null
//             })
//             studentsByYearType[currentYear].regular++
//           }

//           if (year >= 2) {
//             const lateralJoiningYear = calculateJoiningYear(CURRENT_YEAR, year, true)
//             const lateralCount = Math.floor(Math.random() * 2) + 5
//             for (let i = 1; i <= lateralCount; i++) {
//               const serialNum = 70 + i
//               const rollno = generateRollNumber(lateralJoiningYear, branch.code, section, serialNum, true)
//               const currentYear = calculateCurrentAcademicYear(rollno, CURRENT_YEAR)
//               students.push({
//                 _id: new mongoose.Types.ObjectId(),
//                 rollno,
//                 name: generateName(),
//                 branch: branch.name,
//                 section,
//                 college: 'ACET',
//                 password: rollno,
//                 isHashed: false,
//                 img: '',
//                 status: 'active',
//                 phoneno: `${8000000000 + Math.floor(Math.random() * 999999999)}`,
//                 year: currentYear,
//                 transport: Math.random() > 0.5 ? 'Bus' : 'Own',
//                 fatherName: generateName(),
//                 motherName: generateName(),
//                 email: generateEmail(rollno),
//                 sessionId: null
//               })
//               studentsByYearType[currentYear].lateral++
//             }
//           }
//         }
//       }
//     }

//     // ✅ Batch insert students safely (skip duplicates)
//     console.log(`\n📦 Inserting ${students.length} students in batches...`)
//     const batchSize = 500
//     let totalInserted = 0

//     for (let i = 0; i < students.length; i += batchSize) {
//       const batch = students.slice(i, i + batchSize)
//       try {
//         const result = await Student.collection.insertMany(batch, { ordered: false })
//         totalInserted += result.insertedCount
//         console.log(`✅ Batch ${i / batchSize + 1} inserted (${result.insertedCount} records)`)
//       } catch (err) {
//         if (err.code === 11000) {
//           console.warn(`⚠️ Duplicate roll numbers in batch ${i / batchSize + 1}, skipped.`)
//         } else {
//           console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, err.message)
//         }
//       }
//     }

//     console.log(`\n✅ Total students inserted successfully: ${totalInserted}\n`)

//     console.log('📊 SEED DATA SUMMARY:')
//     console.log('='.repeat(60))
//     console.log(`Faculties: ${insertedFaculties.length}`)
//     console.log(`Subjects: ${insertedSubjects.length}`)
//     console.log(`Students: ${students.length}`)
//     console.log(`  - Regular: ${students.filter(s => s.rollno.includes('1A')).length}`)
//     console.log(`  - Lateral Entry: ${students.filter(s => s.rollno.includes('5A')).length}`)

//     console.log('\n📚 Students by Current Academic Year:')
//     console.log('='.repeat(60))
//     for (const year of YEARS) {
//       console.log(`\nYear ${year}:`)
//       console.log(`  Regular: ${studentsByYearType[year].regular}`)
//       console.log(`  Lateral: ${studentsByYearType[year].lateral}`)
//       console.log(`  Total: ${studentsByYearType[year].regular + studentsByYearType[year].lateral}`)
//     }

//     console.log('\n✅ Database seeding completed successfully!')
//   } catch (error) {
//     console.error('❌ Error seeding database:', error)
//   } finally {
//     console.log('\n🔌 Closing database connection...')
//     await mongoose.connection.close()
//     console.log('✅ Database connection closed')
//   }
// }

// seedDatabase()


import mongoose from 'mongoose'
import { Faculty } from './models/faculty.model.js'
import { Subject } from './models/subject.model.js'
import { Student } from './models/student.model.js'
import dotenv from 'dotenv'
dotenv.config()

// ========== CONFIGURATION ==========
const MONGO_URI = process.env.MONGO_URL
const CURRENT_YEAR = 2025
// ===================================

const BRANCH = { code: '44', name: 'CSE-DS', fullName: 'CSE - Data Science' }

// Sections per year
const SECTIONS_BY_YEAR = {
  2: ['A', 'B', 'C'],
  3: ['A', 'B', 'C'],
  4: ['A']
}

const COLLEGE_CODE = 'P3'

function calculateJoiningYear(currentYear, academicYear, isLateral = false) {
  return isLateral ? currentYear - (academicYear - 2) : currentYear - (academicYear - 1)
}

function calculateCurrentAcademicYear(rollno, currentYear) {
  const joiningYearShort = rollno.substring(0, 2)
  const joiningYear = parseInt('20' + joiningYearShort)
  const isLateral = rollno.substring(4, 5) === '5'
  const yearsPassed = currentYear - joiningYear
  const currentAcademicYear = isLateral ? 2 + yearsPassed : 1 + yearsPassed
  return Math.min(Math.max(currentAcademicYear, 1), 4)
}

function generateRollNumber(year, branchCode, section, serialNum, isLateral = false) {
  const yearPrefix = year.toString().slice(-2)
  const entryType = isLateral ? '5' : '1'
  let serialStr
  if (serialNum <= 99) {
    serialStr = serialNum.toString().padStart(2, '0')
  } else {
    const letterIndex = Math.floor((serialNum - 100) / 10)
    const digitIndex = (serialNum - 100) % 10
    const letter = String.fromCharCode(65 + letterIndex)
    serialStr = `${letter}${digitIndex}`
  }
  return `${yearPrefix}${COLLEGE_CODE}${entryType}${section}${branchCode}${serialStr}`
}

function generateEmail(rollno) {
  return `${rollno.toLowerCase()}@acet.ac.in`
}

const firstNames = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Karthik', 'Divya',
  'Rohan', 'Meera', 'Arjun', 'Pooja', 'Sanjay', 'Kavya', 'Nikhil', 'Riya',
  'Aditya', 'Shreya', 'Varun', 'Nisha', 'Manish', 'Swati', 'Suresh', 'Ananya',
  'Praveen', 'Deepika', 'Rajesh', 'Lakshmi', 'Harish', 'Vani', 'Krishna', 'Sahana',
  'Naveen', 'Bhavana', 'Ganesh', 'Pavitra', 'Mahesh', 'Soundarya', 'Ramesh', 'Srilatha',
  'Venkat', 'Madhuri', 'Sunil', 'Rekha', 'Prakash', 'Uma', 'Santosh', 'Radha',
  'Mohan', 'Sushma', 'Gopal', 'Lavanya', 'Ravi', 'Sailaja', 'Anil', 'Vasudha',
  'Bhaskar', 'Shruthi', 'Charan', 'Mythili', 'Dinesh', 'Padma', 'Eswar', 'Tejasvi',
  'Farhan', 'Zoya', 'Imran', 'Ayesha', 'Sameer', 'Nazia', 'Adnan', 'Sana'
]

const lastNames = [
  'Kumar', 'Reddy', 'Sharma', 'Rao', 'Patel', 'Singh', 'Gupta', 'Nair',
  'Iyer', 'Verma', 'Agarwal', 'Joshi', 'Desai', 'Malhotra', 'Chopra', 'Kapoor',
  'Mehta', 'Kulkarni', 'Naidu', 'Chowdhury', 'Shetty', 'Menon', 'Pillai', 'Khan'
]

function generateName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${first} ${last}`
}

const facultyNames = [
  'Dr. Venkatesh Kumar', 'Prof. Lakshmi Devi', 'Dr. Rajendra Prasad', 'Prof. Madhavi Latha',
  'Dr. Srinivas Rao', 'Prof. Sailaja Reddy', 'Dr. Ramesh Babu', 'Prof. Kavitha Sharma',
  'Dr. Suresh Kumar', 'Prof. Anitha Rao', 'Dr. Prasad Reddy', 'Prof. Sowjanya Devi',
  'Dr. Narayana Swamy', 'Prof. Padmavathi', 'Dr. Kiran Kumar'
]

const subjectsByYear = {
  2: [
    { name: 'Engineering Mathematics-II', code: 'MA201' },
    { name: 'Data Structures', code: 'CS201' },
    { name: 'Digital Logic Design', code: 'EC201' },
    { name: 'Object Oriented Programming', code: 'CS202' },
    { name: 'Computer Organization', code: 'CS203' }
  ],
  3: [
    { name: 'Database Management Systems', code: 'CS301' },
    { name: 'Operating Systems', code: 'CS302' },
    { name: 'Computer Networks', code: 'CS303' },
    { name: 'Software Engineering', code: 'CS304' },
    { name: 'Web Technologies', code: 'CS305' }
  ],
  4: [
    { name: 'Machine Learning', code: 'CS401' },
    { name: 'Artificial Intelligence', code: 'CS402' },
    { name: 'Cloud Computing', code: 'CS403' },
    { name: 'Cyber Security', code: 'CS404' },
    { name: 'Big Data Analytics', code: 'CS405' }
  ]
}

async function seedDatabase() {
  try {
    console.log('🔄 Starting database seed for CSE-DS Department...\n')
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    await Faculty.deleteMany({})
    await Subject.deleteMany({})
    await Student.deleteMany({})
    console.log('🗑️  Cleared existing data\n')

    // Faculties
    const faculties = []
    for (let i = 0; i < 15; i++) {
      faculties.push({
        _id: new mongoose.Types.ObjectId(),
        empId: `EMP${(10001 + i).toString()}`,
        name: facultyNames[i],
        branch: BRANCH.name,
        password: `faculty${i + 1}`,
        isHashed: false,
        img: '',
        sessionId: null,
        subjects: []
      })
    }

    const insertedFaculties = await Faculty.insertMany(faculties)
    console.log(`✅ Created ${insertedFaculties.length} faculties`)

    // Subjects
    const subjects = []
    let facultyIndex = 0
    for (const year of Object.keys(subjectsByYear)) {
      for (const section of SECTIONS_BY_YEAR[year]) {
        for (const subjectInfo of subjectsByYear[year]) {
          const facultyId = insertedFaculties[facultyIndex % insertedFaculties.length]._id
          subjects.push({
            _id: new mongoose.Types.ObjectId(),
            subjectName: subjectInfo.name,
            subjectCode: `${subjectInfo.code}-Y${year}-${BRANCH.code}-${section}`,
            year: parseInt(year),
            section: section,
            branch: BRANCH.name,
            faculty: facultyId
          })
          facultyIndex++
        }
      }
    }

    const insertedSubjects = await Subject.insertMany(subjects)
    console.log(`✅ Created ${insertedSubjects.length} subjects`)

    // Link subjects to faculties
    for (const faculty of insertedFaculties) {
      const assignedSubjects = insertedSubjects
        .filter(s => s.faculty.toString() === faculty._id.toString())
        .map(s => s._id)
      await Faculty.findByIdAndUpdate(faculty._id, { subjects: assignedSubjects })
    }

    // Students
    const students = []
    const studentsByYearType = { 2: { regular: 0, lateral: 0 }, 3: { regular: 0, lateral: 0 }, 4: { regular: 0, lateral: 0 } }

    for (const year of [2, 3, 4]) {
      for (const section of SECTIONS_BY_YEAR[year]) {
        const regularJoiningYear = calculateJoiningYear(CURRENT_YEAR, year, false)
        for (let i = 1; i <= 70; i++) {
          const rollno = generateRollNumber(regularJoiningYear, BRANCH.code, section, i, false)
          const currentYear = calculateCurrentAcademicYear(rollno, CURRENT_YEAR)
          students.push({
            _id: new mongoose.Types.ObjectId(),
            rollno,
            name: generateName(),
            branch: BRANCH.name,
            section,
            college: 'ACET',
            password: rollno,
            isHashed: false,
            img: '',
            status: 'active',
            phoneno: `${8000000000 + Math.floor(Math.random() * 999999999)}`,
            year: currentYear,
            transport: Math.random() > 0.5 ? 'Bus' : 'Own',
            fatherName: generateName(),
            motherName: generateName(),
            email: generateEmail(rollno),
            sessionId: null
          })
          studentsByYearType[currentYear].regular++
        }

        const lateralJoiningYear = calculateJoiningYear(CURRENT_YEAR, year, true)
        const lateralCount = Math.floor(Math.random() * 2) + 5
        for (let i = 1; i <= lateralCount; i++) {
          const serialNum = 70 + i
          const rollno = generateRollNumber(lateralJoiningYear, BRANCH.code, section, serialNum, true)
          const currentYear = calculateCurrentAcademicYear(rollno, CURRENT_YEAR)
          students.push({
            _id: new mongoose.Types.ObjectId(),
            rollno,
            name: generateName(),
            branch: BRANCH.name,
            section,
            college: 'ACET',
            password: rollno,
            isHashed: false,
            img: '',
            status: 'active',
            phoneno: `${8000000000 + Math.floor(Math.random() * 999999999)}`,
            year: currentYear,
            transport: Math.random() > 0.5 ? 'Bus' : 'Own',
            fatherName: generateName(),
            motherName: generateName(),
            email: generateEmail(rollno),
            sessionId: null
          })
          studentsByYearType[currentYear].lateral++
        }
      }
    }

    console.log(`\n📦 Inserting ${students.length} students in batches...`)
    const batchSize = 500
    let totalInserted = 0

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)
      try {
        const result = await Student.collection.insertMany(batch, { ordered: false })
        totalInserted += result.insertedCount
        console.log(`✅ Batch ${i / batchSize + 1} inserted (${result.insertedCount} records)`)
      } catch (err) {
        if (err.code === 11000) console.warn(`⚠️ Duplicate roll numbers in batch ${i / batchSize + 1}`)
        else console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, err.message)
      }
    }

    console.log(`\n✅ Total students inserted: ${totalInserted}`)
    console.log('📊 SEED DATA SUMMARY:')
    console.log('='.repeat(50))
    console.log(`Faculties: ${insertedFaculties.length}`)
    console.log(`Subjects: ${insertedSubjects.length}`)
    console.log(`Students: ${students.length}`)
    console.log(`  Regular: ${students.filter(s => s.rollno.includes('1')).length}`)
    console.log(`  Lateral: ${students.filter(s => s.rollno.includes('5')).length}`)

    for (const year of [2, 3, 4]) {
      console.log(`\nYear ${year}:`)
      console.log(`  Regular: ${studentsByYearType[year].regular}`)
      console.log(`  Lateral: ${studentsByYearType[year].lateral}`)
      console.log(`  Total: ${studentsByYearType[year].regular + studentsByYearType[year].lateral}`)
    }

    console.log('\n✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    console.log('\n🔌 Closing database connection...')
    await mongoose.connection.close()
    console.log('✅ Database connection closed')
  }
}

seedDatabase()
