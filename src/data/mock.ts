export type Status = "Active" | "Upcoming" | "Expired" | "Cancelled" | "Pending" | "Redeemed" | "Revoked" | "Archived"

export type Student = {
  id: string
  name: string
  phone: string
  telegram: boolean
  membershipCount: number
  status: "Active" | "Disabled"
  language: "English" | "မြန်မာ"
  created: string
}

export type Program = {
  id: string
  name: string
  mmName: string
  description: string
  benefits: string
  members: number
  status: "Active" | "Archived"
  created: string
}

export type Invitation = {
  id: string
  studentId: string
  student: string
  phone: string
  program: string
  start: string
  expiry: string
  status: "Pending" | "Redeemed" | "Expired" | "Revoked"
  created: string
}

export type Membership = {
  id: string
  studentId: string
  student: string
  program: string
  start: string
  expiry: string
  status: "Active" | "Upcoming" | "Expired" | "Cancelled"
}

export const initialStudents: Student[] = [
  {
    id: "STU-1024",
    name: "Thiri Aung",
    phone: "+95 9 421 895 204",
    telegram: true,
    membershipCount: 2,
    status: "Active",
    language: "English",
    created: "12 Jan 2025",
  },
  {
    id: "STU-1023",
    name: "Min Khant",
    phone: "+95 9 774 612 398",
    telegram: true,
    membershipCount: 1,
    status: "Active",
    language: "မြန်မာ",
    created: "10 Jan 2025",
  },
  {
    id: "STU-1022",
    name: "Su Myat Noe",
    phone: "+95 9 968 421 350",
    telegram: false,
    membershipCount: 0,
    status: "Active",
    language: "English",
    created: "08 Jan 2025",
  },
  {
    id: "STU-1021",
    name: "Nay Lin Htet",
    phone: "+95 9 450 223 118",
    telegram: true,
    membershipCount: 1,
    status: "Disabled",
    language: "မြန်မာ",
    created: "04 Jan 2025",
  },
  {
    id: "STU-1020",
    name: "Hnin Wai Phyo",
    phone: "+95 9 792 818 445",
    telegram: true,
    membershipCount: 1,
    status: "Active",
    language: "English",
    created: "28 Dec 2024",
  },
]

export const initialPrograms: Program[] = [
  {
    id: "PRG-01",
    name: "MOE Premium Learning",
    mmName: "MOE အဆင့်မြင့် သင်ယူမှု",
    description:
      "Premium access to learning resources, mentorship, and member support.",
    benefits: "Resource library, monthly mentoring, priority support",
    members: 286,
    status: "Active",
    created: "04 Sep 2024",
  },
  {
    id: "PRG-02",
    name: "Career Accelerator",
    mmName: "အလုပ်အကိုင် အရှိန်မြှင့်",
    description: "Practical career development for ambitious learners.",
    benefits: "Career workshops, CV review, community access",
    members: 174,
    status: "Active",
    created: "18 Oct 2024",
  },
  {
    id: "PRG-03",
    name: "Foundation Membership",
    mmName: "အခြေခံ အဖွဲ့ဝင်",
    description: "Essential tools and a supportive student community.",
    benefits: "Community access, starter resources",
    members: 104,
    status: "Active",
    created: "02 Nov 2024",
  },
  {
    id: "PRG-04",
    name: "Legacy Scholars",
    mmName: "ပညာတော်သင်ဟောင်းများ",
    description: "Archived scholarship program.",
    benefits: "Scholar network",
    members: 42,
    status: "Archived",
    created: "15 May 2024",
  },
]

export const initialInvitations: Invitation[] = [
  {
    id: "INV-2048",
    studentId: "STU-1022",
    student: "Su Myat Noe",
    phone: "+95 9 968 421 350",
    program: "MOE Premium Learning",
    start: "01 Feb 2025",
    expiry: "31 Jan 2026",
    status: "Pending",
    created: "24 Jan 2025",
  },
  {
    id: "INV-2047",
    studentId: "STU-1023",
    student: "Min Khant",
    phone: "+95 9 774 612 398",
    program: "Career Accelerator",
    start: "20 Jan 2025",
    expiry: "19 Jan 2026",
    status: "Redeemed",
    created: "19 Jan 2025",
  },
  {
    id: "INV-2046",
    studentId: "STU-1020",
    student: "Hnin Wai Phyo",
    phone: "+95 9 792 818 445",
    program: "Foundation Membership",
    start: "15 Jan 2025",
    expiry: "14 Jul 2025",
    status: "Expired",
    created: "06 Jan 2025",
  },
  {
    id: "INV-2045",
    studentId: "STU-1021",
    student: "Nay Lin Htet",
    phone: "+95 9 450 223 118",
    program: "Career Accelerator",
    start: "12 Jan 2025",
    expiry: "11 Jan 2026",
    status: "Revoked",
    created: "05 Jan 2025",
  },
]

export const initialMemberships: Membership[] = [
  {
    id: "MEM-82941",
    studentId: "STU-1024",
    student: "Thiri Aung",
    program: "MOE Premium Learning",
    start: "01 Jan 2025",
    expiry: "31 Dec 2025",
    status: "Active",
  },
  {
    id: "MEM-82940",
    studentId: "STU-1024",
    student: "Thiri Aung",
    program: "Career Accelerator",
    start: "15 Feb 2025",
    expiry: "14 Feb 2026",
    status: "Upcoming",
  },
  {
    id: "MEM-82939",
    studentId: "STU-1023",
    student: "Min Khant",
    program: "Career Accelerator",
    start: "20 Jan 2025",
    expiry: "19 Jan 2026",
    status: "Active",
  },
  {
    id: "MEM-82938",
    studentId: "STU-1020",
    student: "Hnin Wai Phyo",
    program: "Foundation Membership",
    start: "15 Jul 2024",
    expiry: "14 Jan 2025",
    status: "Expired",
  },
  {
    id: "MEM-82937",
    studentId: "STU-1021",
    student: "Nay Lin Htet",
    program: "Career Accelerator",
    start: "01 Sep 2024",
    expiry: "31 Aug 2025",
    status: "Cancelled",
  },
]
