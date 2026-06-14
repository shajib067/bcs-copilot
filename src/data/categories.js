export const CATEGORIES = [
  {
    id: 'bangla',
    name: 'বাংলা ভাষা ও সাহিত্য',
    nameEn: 'Bangla Language & Literature',
    marks: 35,
    color: '#006A4E',
  },
  {
    id: 'english',
    name: 'English Language & Literature',
    nameEn: 'English Language & Literature',
    marks: 35,
    color: '#1565C0',
  },
  {
    id: 'bd_affairs',
    name: 'বাংলাদেশ বিষয়াবলী',
    nameEn: 'Bangladesh Affairs',
    marks: 30,
    color: '#D32F2F',
  },
  {
    id: 'intl_affairs',
    name: 'আন্তর্জাতিক বিষয়াবলী',
    nameEn: 'International Affairs',
    marks: 20,
    color: '#6A1B9A',
  },
  {
    id: 'geography',
    name: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা',
    nameEn: 'Geography, Environment & Disaster Management',
    marks: 10,
    color: '#2E7D32',
  },
  {
    id: 'science',
    name: 'সাধারণ বিজ্ঞান',
    nameEn: 'General Science',
    marks: 15,
    color: '#EF6C00',
  },
  {
    id: 'ict',
    name: 'কম্পিউটার ও তথ্য প্রযুক্তি',
    nameEn: 'Computer & ICT',
    marks: 15,
    color: '#00838F',
  },
  {
    id: 'math',
    name: 'গাণিতিক যুক্তি',
    nameEn: 'Mathematical Reasoning',
    marks: 15,
    color: '#5D4037',
  },
  {
    id: 'mental',
    name: 'মানসিক দক্ষতা',
    nameEn: 'Mental Ability',
    marks: 15,
    color: '#AD1457',
  },
  {
    id: 'ethics',
    name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন',
    nameEn: 'Ethics, Values & Good Governance',
    marks: 10,
    color: '#455A64',
  },
];

export const TOTAL_MARKS = 200;
export const MOCK_TEST_DURATION_MIN = 60;

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}
