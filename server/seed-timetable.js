// import mongoose from 'mongoose'
// import { Timetable } from './models/timetable.model.js'
// import { Subject } from './models/subject.model.js'
// import { Faculty } from './models/faculty.model.js'
// import dotenv from 'dotenv'
// dotenv.config()

// // ========== CONFIGURATION ==========
// const MONGO_URI = process.env.MONGO_URL

// // College Period Timings (Monday to Saturday)
// const PERIOD_TIMINGS = [
//   { periodNumber: 1, startTime: '09:00', endTime: '09:50' },
//   { periodNumber: 2, startTime: '10:00', endTime: '10:50' },
//   { periodNumber: 3, startTime: '11:00', endTime: '11:50' },
//   { periodNumber: 4, startTime: '12:00', endTime: '12:50' },
//   // Lunch Break: 12:50 - 13:30
//   { periodNumber: 5, startTime: '13:30', endTime: '14:20' },
//   { periodNumber: 6, startTime: '14:30', endTime: '15:20' },
//   { periodNumber: 7, startTime: '15:30', endTime: '16:20' },
//   { periodNumber: 8, startTime: '16:30', endTime: '17:20' }
// ]

// const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// // Room configuration
// const ROOM_BLOCKS = ['A', 'B', 'C', 'D']
// const ROOMS_PER_BLOCK = 20

// function generateRoomNumber() {
//   const block = ROOM_BLOCKS[Math.floor(Math.random() * ROOM_BLOCKS.length)]
//   const roomNum = Math.floor(Math.random() * ROOMS_PER_BLOCK) + 1
//   return `${block}-${roomNum.toString().padStart(3, '0')}`
// }

// // ===================================

// async function seedTimetable() {
//   try {
//     console.log('🔄 Starting timetable seed...\n')
//     console.log('📅 Working Days: Monday to Saturday')
//     console.log('⏰ Periods per day: 8')
//     console.log('🕐 First period: 09:00 AM')
//     console.log('🕔 Last period: 05:20 PM\n')

//     // Validate environment
//     if (!MONGO_URI) {
//       throw new Error('❌ MONGO_URL not found in .env')
//     }

//     await mongoose.connect(MONGO_URI)
//     console.log('✅ Connected to MongoDB\n')

//     // Clear existing timetable
//     await Timetable.deleteMany({})
//     console.log('🗑️  Cleared existing timetable data\n')

//     // Fetch all subjects with faculty
//     const subjects = await Subject.find({})
//       .populate('faculty', 'name empId')
//       .lean()

//     if (subjects.length === 0) {
//       throw new Error('❌ No subjects found! Please run seed.js first.')
//     }

//     console.log(`📚 Found ${subjects.length} subjects`)

//     // Group subjects by Year, Branch, Section
//     const groupedSubjects = {}
    
//     for (const subject of subjects) {
//       const key = `Y${subject.year}-${subject.branch}-${subject.section}`
//       if (!groupedSubjects[key]) {
//         groupedSubjects[key] = {
//           year: subject.year,
//           branch: subject.branch,
//           section: subject.section,
//           subjects: []
//         }
//       }
//       groupedSubjects[key].subjects.push(subject)
//     }

//     console.log(`📊 Found ${Object.keys(groupedSubjects).length} unique class groups\n`)

//     const timetableEntries = []
//     let totalSlots = 0
//     let filledSlots = 0

//     // Generate timetable for each class group
//     for (const [groupKey, group] of Object.entries(groupedSubjects)) {
//       console.log(`\n📋 Generating timetable for: Year ${group.year}, ${group.branch}, Section ${group.section}`)
//       console.log(`   Subjects: ${group.subjects.length}`)

//       const { year, branch, section, subjects: classSubjects } = group

//       // Calculate periods per subject per week
//       const totalPeriodsPerWeek = WORKING_DAYS.length * PERIOD_TIMINGS.length // 48 periods
//       const subjectsCount = classSubjects.length
//       const periodsPerSubject = Math.floor(totalPeriodsPerWeek / subjectsCount) // ~9-10 periods per subject
      
//       // Leave last 2 periods on Saturday for activities/sports
//       const availableSlots = totalPeriodsPerWeek - 2
//       totalSlots += availableSlots

//       console.log(`   Total periods/week: ${totalPeriodsPerWeek}`)
//       console.log(`   Available slots: ${availableSlots}`)
//       console.log(`   Periods per subject: ~${periodsPerSubject}`)

//       // Track subject allocation count
//       const subjectAllocation = classSubjects.map(s => ({
//         subject: s,
//         allocated: 0,
//         target: periodsPerSubject
//       }))

//       let subjectIndex = 0

//       // Distribute subjects across days and periods
//       for (const day of WORKING_DAYS) {
//         let periodsForDay = [...PERIOD_TIMINGS]

//         // Saturday: Skip last 2 periods (Sports/Activities)
//         if (day === 'Saturday') {
//           periodsForDay = PERIOD_TIMINGS.slice(0, -2)
//         }

//         for (const period of periodsForDay) {
//           // Find next subject that needs allocation
//           let attempts = 0
//           let selectedSubject = null

//           while (attempts < classSubjects.length) {
//             const allocation = subjectAllocation[subjectIndex % classSubjects.length]
            
//             if (allocation.allocated < allocation.target) {
//               selectedSubject = allocation
//               break
//             }

//             subjectIndex++
//             attempts++
//           }

//           // If no subject needs allocation, pick any
//           if (!selectedSubject) {
//             selectedSubject = subjectAllocation[subjectIndex % classSubjects.length]
//           }

//           const subject = selectedSubject.subject

//           // Create timetable entry
//           const entry = {
//             day,
//             periodNumber: period.periodNumber,
//             startTime: period.startTime,
//             endTime: period.endTime,
//             subjectId: subject._id,
//             facultyId: subject.faculty._id,
//             year,
//             branch,
//             section,
//             roomNumber: generateRoomNumber(),
//             isActive: true
//           }

//           timetableEntries.push(entry)
//           selectedSubject.allocated++
//           filledSlots++
//           subjectIndex++
//         }
//       }

//       // Log allocation summary
//       console.log('   Allocation summary:')
//       for (const alloc of subjectAllocation) {
//         console.log(`     - ${alloc.subject.subjectCode}: ${alloc.allocated} periods`)
//       }
//     }

//     console.log(`\n📦 Inserting ${timetableEntries.length} timetable entries...`)

//     // Batch insert
//     const batchSize = 500
//     let inserted = 0

//     for (let i = 0; i < timetableEntries.length; i += batchSize) {
//       const batch = timetableEntries.slice(i, i + batchSize)
//       try {
//         const result = await Timetable.insertMany(batch, { ordered: false })
//         inserted += result.length
//         console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted (${result.length} records)`)
//       } catch (err) {
//         if (err.code === 11000) {
//           // Handle duplicate entries
//           console.warn(`⚠️  Some duplicate entries in batch ${Math.floor(i / batchSize) + 1}, continuing...`)
//           // Count successful inserts from writeErrors
//           const successfulInserts = batch.length - (err.writeErrors?.length || 0)
//           inserted += successfulInserts
//         } else {
//           console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, err.message)
//         }
//       }
//     }

//     console.log(`\n✅ Total timetable entries inserted: ${inserted}`)

//     // Statistics
//     console.log('\n📊 TIMETABLE SEED SUMMARY:')
//     console.log('='.repeat(60))
//     console.log(`Total Class Groups: ${Object.keys(groupedSubjects).length}`)
//     console.log(`Total Subjects: ${subjects.length}`)
//     console.log(`Total Periods per Week: ${WORKING_DAYS.length * PERIOD_TIMINGS.length}`)
//     console.log(`Available Slots: ${totalSlots}`)
//     console.log(`Filled Slots: ${filledSlots}`)
//     console.log(`Utilization: ${((filledSlots / totalSlots) * 100).toFixed(1)}%`)

//     // Sample timetable for one class
//     console.log('\n📅 SAMPLE TIMETABLE (Year 1, CSE, Section A - Monday):')
//     console.log('='.repeat(80))
    
//     const sampleEntries = await Timetable.find({
//       year: 1,
//       branch: 'CSE',
//       section: 'A',
//       day: 'Monday'
//     })
//       .populate('subjectId', 'subjectCode subjectName')
//       .populate('facultyId', 'name')
//       .sort({ periodNumber: 1 })
//       .lean()

//     if (sampleEntries.length > 0) {
//       for (const entry of sampleEntries) {
//         const lunch = entry.periodNumber === 4 ? '\n    [LUNCH BREAK: 12:50 - 13:30]' : ''
//         console.log(
//           `Period ${entry.periodNumber} (${entry.startTime}-${entry.endTime}): ` +
//           `${entry.subjectId.subjectCode} - ${entry.subjectId.subjectName} ` +
//           `| Faculty: ${entry.facultyId.name} | Room: ${entry.roomNumber}${lunch}`
//         )
//       }
//     }

//     // Faculty workload analysis
//     console.log('\n👨‍🏫 FACULTY WORKLOAD (Top 5):')
//     console.log('='.repeat(60))
    
//     const facultyWorkload = await Timetable.aggregate([
//       { $group: { _id: '$facultyId', periodsCount: { $sum: 1 } } },
//       { $sort: { periodsCount: -1 } },
//       { $limit: 5 }
//     ])

//     for (const fw of facultyWorkload) {
//       const faculty = await Faculty.findById(fw._id).select('name empId')
//       console.log(`${faculty.name} (${faculty.empId}): ${fw.periodsCount} periods/week`)
//     }

//     console.log('\n✅ Timetable seeding completed successfully!')
//     console.log('\n💡 TIP: Faculty can now start attendance sessions only during their scheduled periods!')

//   } catch (error) {
//     console.error('❌ Error seeding timetable:', error)
//   } finally {
//     console.log('\n🔌 Closing database connection...')
//     await mongoose.connection.close()
//     console.log('✅ Database connection closed')
//   }
// }

// seedTimetable()


// timetable-seed-cse-ds.js
import mongoose from 'mongoose'
import { Timetable } from './models/timetable.model.js'
import { Subject } from './models/subject.model.js'
import { Faculty } from './models/faculty.model.js'
import dotenv from 'dotenv'
dotenv.config()

// ========== CONFIG ==========
const MONGO_URI = process.env.MONGO_URL
const TARGET_BRANCH = 'CSE-DS' // branch 44
const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIOD_TIMINGS = [
  { periodNumber: 1, startTime: '09:00', endTime: '09:50' },
  { periodNumber: 2, startTime: '10:00', endTime: '10:50' },
  { periodNumber: 3, startTime: '11:00', endTime: '11:50' },
  { periodNumber: 4, startTime: '12:00', endTime: '12:50' },
  // Lunch break 12:50 - 13:30
  { periodNumber: 5, startTime: '13:30', endTime: '14:20' },
  { periodNumber: 6, startTime: '14:30', endTime: '15:20' },
  { periodNumber: 7, startTime: '15:30', endTime: '16:20' },
  { periodNumber: 8, startTime: '16:30', endTime: '17:20' }
]
const SATURDAY_RESERVED = 2 // last two periods reserved on Saturday
const ROOM_BLOCKS = ['A', 'B', 'C', 'D']
const ROOMS_PER_BLOCK = 20
const MAX_FACULTY_CLASSES_PER_DAY = 6
// ===================================

function generateRoomNumber() {
  const block = ROOM_BLOCKS[Math.floor(Math.random() * ROOM_BLOCKS.length)]
  const roomNum = Math.floor(Math.random() * ROOMS_PER_BLOCK) + 1
  return `${block}-${roomNum.toString().padStart(3, '0')}`
}

function shortId(id) {
  return String(id).slice(-6)
}

async function seedTimetable() {
  try {
    if (!MONGO_URI) throw new Error('MONGO_URL missing in .env')
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected')

    // Clear existing timetable entries
    await Timetable.deleteMany({})
    console.log('🗑️ Cleared existing Timetable collection\n')

    // Load subjects only for the target branch and years 2-4 (only those exist per your seed plan)
    const subjects = await Subject.find({ branch: TARGET_BRANCH }).populate('faculty', 'name empId').lean()
    if (!subjects || subjects.length === 0) {
      throw new Error(`No subjects found for branch "${TARGET_BRANCH}". Run subject/student/faculty seeder first.`)
    }
    console.log(`📚 Loaded ${subjects.length} subjects for branch ${TARGET_BRANCH}`)

    // Group subjects by class group (year-branch-section)
    const grouped = {}
    for (const s of subjects) {
      const key = `Y${s.year}-${s.branch}-${s.section}`
      if (!grouped[key]) grouped[key] = { year: s.year, branch: s.branch, section: s.section, subjects: [] }
      grouped[key].subjects.push(s)
    }
    const classGroups = Object.values(grouped)
    console.log(`📊 Found ${classGroups.length} class groups to schedule\n`)

    // Preload faculties (those referenced by subjects) and initialize faculty availability maps
    const facultyIds = Array.from(new Set(subjects.map(s => s.faculty && s.faculty._id).filter(Boolean)))
    const faculties = await Faculty.find({ _id: { $in: facultyIds } }).lean()
    const facultyMap = new Map(faculties.map(f => [String(f._id), f]))

    // Data structures to avoid conflicts
    const facultyBusy = new Map() // facultyId -> { "Monday": Set(periodNumbers) ... }
    const facultyDailyCount = new Map() // facultyId -> { "Monday": count, ... }
    const roomBusy = new Map() // `${day}-${period}` -> Set(roomNumbers)
    const classSlotAssigned = new Set() // `${groupKey}-${day}-${period}` to ensure one faculty per class slot

    // Helpers
    function isFacultyFree(facId, day, periodNumber) {
      const map = facultyBusy.get(String(facId))
      if (!map) return true
      return !map[day]?.has(periodNumber)
    }
    function markFacultyBusy(facId, day, periodNumber) {
      const id = String(facId)
      if (!facultyBusy.has(id)) facultyBusy.set(id, {})
      const map = facultyBusy.get(id)
      if (!map[day]) map[day] = new Set()
      map[day].add(periodNumber)

      if (!facultyDailyCount.has(id)) facultyDailyCount.set(id, {})
      const counts = facultyDailyCount.get(id)
      counts[day] = (counts[day] || 0) + 1
    }
    function facultyDayCount(facId, day) {
      return (facultyDailyCount.get(String(facId)) || {})[day] || 0
    }
    function getFreeRoom(day, periodNumber) {
      const key = `${day}-${periodNumber}`
      if (!roomBusy.has(key)) roomBusy.set(key, new Set())
      const used = roomBusy.get(key)
      // Try to find a random free room (limited attempts)
      for (let attempt = 0; attempt < 200; attempt++) {
        const r = generateRoomNumber()
        if (!used.has(r)) {
          used.add(r)
          return r
        }
      }
      // fallback deterministic room
      const fallback = `${ROOM_BLOCKS[0]}-001`
      used.add(fallback)
      return fallback
    }

    // Count overall stats
    let totalSlotsPlanned = 0
    let totalSlotsFilled = 0
    const timetableEntries = []
    const unfilledReasons = [] // collect reasons for empty slots

    // For each class group generate allocation targets
    for (const group of classGroups) {
      const { year, branch, section } = group
      const groupKey = `Y${year}-${branch}-${section}`
      const classSubjects = group.subjects.slice() // array of subject docs

      console.log(`\n📋 Scheduling for ${groupKey} — ${classSubjects.length} subjects`)

      // compute available slots per week (reserve last SATURDAY_RESERVED periods on Saturday)
      const totalPeriodsPerWeek = WORKING_DAYS.length * PERIOD_TIMINGS.length
      const availableSlots = totalPeriodsPerWeek - SATURDAY_RESERVED
      totalSlotsPlanned += availableSlots

      // Fair distribution: base target + distribute remainder
      const subjectsCount = classSubjects.length
      const baseTarget = Math.floor(availableSlots / subjectsCount)
      let remainder = availableSlots - baseTarget * subjectsCount

      // Build allocation objects with target and defensive faculty check
      const allocations = []
      for (const subj of classSubjects) {
        // defensive: skip subjects with no faculty assigned
        if (!subj.faculty || !subj.faculty._id) {
          console.warn(`⚠️ Subject ${subj.subjectCode || subj.subjectName} has no faculty — will be skipped in allocation.`)
          continue
        }
        allocations.push({
          subject: subj,
          allocated: 0,
          target: baseTarget
        })
      }
      // distribute remainder across allocations round-robin
      let idx = 0
      while (remainder > 0 && allocations.length > 0) {
        allocations[idx % allocations.length].target++
        idx++
        remainder--
      }

      // If no allocations (all subjects missing faculty) skip group
      if (allocations.length === 0) {
        console.warn(`❗ No valid subject+faculty pairs for ${groupKey}. Skipping scheduling for this group.`)
        continue
      }

      // Shuffle allocations order slightly to avoid extreme bias (simple rotate by groupKey hash)
      const rotateBy = (groupKey.charCodeAt(0) + groupKey.length) % allocations.length
      const rotated = allocations.slice(rotateBy).concat(allocations.slice(0, rotateBy))

      // keep a pointer to pick next candidate in a round-robin fashion
      let pickIndex = 0
      // local helper to pick a candidate subject for a slot satisfying constraints
      function pickCandidate(day, periodNumber, lastAssignedSubjectId) {
        // Try to find candidate allocations sorted by (allocated/target) asc then by target desc
        // This balances allocation towards under-allocated subjects.
        const candidates = rotated
          .filter(a => a.allocated < a.target)
          .sort((a, b) => (a.allocated / a.target) - (b.allocated / b.target) || b.target - a.target)

        for (let i = 0; i < candidates.length; i++) {
          const a = candidates[(pickIndex + i) % candidates.length]
          const facId = a.subject.faculty._id
          // Skip if faculty busy for this slot
          if (!isFacultyFree(facId, day, periodNumber)) {
            continue
          }
          // Skip if faculty exceeded daily limit
          if (facultyDayCount(facId, day) >= MAX_FACULTY_CLASSES_PER_DAY) {
            continue
          }
          // Avoid same subject twice consecutively in same class
          if (lastAssignedSubjectId && String(a.subject._id) === String(lastAssignedSubjectId)) {
            // try next candidate first
            continue
          }
          // Ok candidate
          pickIndex = (pickIndex + i + 1) % candidates.length // advance pointer
          return a
        }
        // If no candidate found, relax "no-consecutive" condition and try again
        for (let i = 0; i < candidates.length; i++) {
          const a = candidates[i]
          const facId = a.subject.faculty._id
          if (!isFacultyFree(facId, day, periodNumber)) continue
          if (facultyDayCount(facId, day) >= MAX_FACULTY_CLASSES_PER_DAY) continue
          return a
        }
        // none available
        return null
      }

      // per-day last assigned subject tracker to avoid consecutive duplication
      let lastAssignedSubjectIdByDay = {}

      // Iterate over days and periods and assign
      for (const day of WORKING_DAYS) {
        const periodsForDay = day === 'Saturday'
          ? PERIOD_TIMINGS.slice(0, PERIOD_TIMINGS.length - SATURDAY_RESERVED)
          : PERIOD_TIMINGS

        lastAssignedSubjectIdByDay[day] = null

        for (const period of periodsForDay) {
          const periodNumber = period.periodNumber
          const slotKey = `${groupKey}-${day}-${periodNumber}`

          // pick candidate subject allocation for this slot
          const candidate = pickCandidate(day, periodNumber, lastAssignedSubjectIdByDay[day])

          if (!candidate) {
            // Could not find any subject whose faculty is free & within daily limit and needing allocation
            unfilledReasons.push({ groupKey, day, periodNumber, reason: 'No available faculty (busy or reached daily limit) or all subjects done' })
            continue // leave slot empty
          }

          // ensure the faculty is not scheduled at this time for a different class (global)
          const facId = candidate.subject.faculty._id
          if (!isFacultyFree(facId, day, periodNumber)) {
            unfilledReasons.push({ groupKey, day, periodNumber, reason: `Faculty ${facId} busy` })
            continue
          }

          // ensure the class group doesn't already have assignment for this slot (shouldn't, but defensive)
          if (classSlotAssigned.has(slotKey)) {
            unfilledReasons.push({ groupKey, day, periodNumber, reason: 'Class already has assignment for this slot (unexpected)' })
            continue
          }

          // pick a free room for this slot
          const room = getFreeRoom(day, periodNumber)

          // create entry
          const entry = {
            day,
            periodNumber,
            startTime: period.startTime,
            endTime: period.endTime,
            subjectId: candidate.subject._id,
            facultyId: candidate.subject.faculty._id,
            year,
            branch,
            section,
            roomNumber: room,
            isActive: true
          }

          timetableEntries.push(entry)
          candidate.allocated++
          totalSlotsFilled++
          classSlotAssigned.add(slotKey)
          markFacultyBusy(candidate.subject.faculty._id, day, periodNumber)
          lastAssignedSubjectIdByDay[day] = candidate.subject._id
        }
      }

      // Log per-class allocation summary
      console.log('   Allocation summary (subjectCode : allocated/target):')
      for (const a of rotated) {
        console.log(`     - ${a.subject.subjectCode} : ${a.allocated}/${a.target}`)
      }
    } // end classGroups loop

    // Insert generated timetable entries in batches
    console.log(`\n📦 Attempting to insert ${timetableEntries.length} timetable entries...`)
    const batchSize = 500
    let insertedCount = 0
    for (let i = 0; i < timetableEntries.length; i += batchSize) {
      const batch = timetableEntries.slice(i, i + batchSize)
      try {
        const res = await Timetable.insertMany(batch, { ordered: false })
        insertedCount += res.length
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${res.length} entries`)
      } catch (err) {
        // handle duplicates / partial failures
        if (err.writeErrors && err.writeErrors.length > 0) {
          const success = batch.length - err.writeErrors.length
          insertedCount += success
          console.warn(`⚠️ Batch ${Math.floor(i / batchSize) + 1} partially failed: ${err.writeErrors.length} errors, ${success} succeeded`)
        } else {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, err.message)
        }
      }
    }

    // Faculty workload summary (top)
    const facultyWorkload = await Timetable.aggregate([
      { $match: { branch: TARGET_BRANCH } },
      { $group: { _id: '$facultyId', periodsCount: { $sum: 1 } } },
      { $sort: { periodsCount: -1 } }
    ])
    console.log('\n👩‍🏫 Faculty workload summary (total weekly periods):')
    for (const fw of facultyWorkload) {
      const f = facultyMap.get(String(fw._id)) || await Faculty.findById(fw._id).select('name empId').lean()
      console.log(`   - ${f?.name || shortId(fw._id)} (${f?.empId || shortId(fw._id)}): ${fw.periodsCount}`)
    }

    // report unfilled slots
    console.log('\n📊 TIMETABLE SEED SUMMARY:')
    console.log('='.repeat(60))
    console.log(`Class groups scheduled: ${classGroups.length}`)
    console.log(`Total planned slots (per-week available): ${totalSlotsPlanned}`)
    console.log(`Total attempted assignments generated: ${timetableEntries.length}`)
    console.log(`Inserted into DB: ${insertedCount}`)
    console.log(`Filled slots: ${totalSlotsFilled}`)
    console.log(`Unfilled slots (count): ${unfilledReasons.length}`)
    if (unfilledReasons.length > 0) {
      console.log('\nSome sample unfilled slot reasons:')
      console.log(unfilledReasons.slice(0, 10))
      console.log('\nTip: If many slots are unfilled, either increase faculty pool, reduce MAX_FACULTY_CLASSES_PER_DAY, or relax the "no-consecutive" and daily-limit constraints.')
    }

    // Print sample timetable for Year 2, CSE-DS, Section A Monday (if exists)
    console.log('\n📅 Sample timetable (Year 2, CSE-DS, Section A - Monday):')
    const sample = await Timetable.find({ year: 2, branch: TARGET_BRANCH, section: 'A', day: 'Monday' })
      .populate('subjectId', 'subjectCode subjectName')
      .populate('facultyId', 'name empId')
      .sort({ periodNumber: 1 })
      .lean()
    if (sample.length === 0) {
      console.log('   (no entries found for this sample group)')
    } else {
      for (const e of sample) {
        console.log(`   Period ${e.periodNumber} (${e.startTime}-${e.endTime}): ${e.subjectId.subjectCode} - ${e.subjectId.subjectName} | Faculty: ${e.facultyId.name} | Room: ${e.roomNumber}`)
      }
    }

    console.log('\n✅ Timetable seeding completed.')
  } catch (err) {
    console.error('❌ Fatal error while seeding timetable:', err)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 MongoDB connection closed')
  }
}

seedTimetable()

