// Demo storage for subjects (in-memory, will reset on server restart)
import type { ISubject } from '@studymate/shared';

// In-memory storage for demo subjects
let demoSubjectsStorage: ISubject[] = [
  {
    _id: '507f1f77bcf86cd799439011' as any,
    name: 'Mathématiques Terminale S',
    description: 'Mathématiques avancées pour Terminale Scientifique',
    level: 'lycee',
    category: 'mathematics',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '507f1f77bcf86cd799439012' as any,
    name: 'Physique-Chimie 1ère',
    description: 'Sciences physiques niveau première',
    level: 'lycee',
    category: 'physics',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '507f1f77bcf86cd799439013' as any,
    name: 'Informatique L1',
    description: 'Introduction à l\'informatique - Licence 1',
    level: 'superieur',
    category: 'computer-science',
    credits: 6,
    volume: 60,
    higherEducationContext: {
      institution: 'Université de Paris',
      institutionType: 'university',
      degree: 'Licence Informatique',
      year: 1,
      semester: 'S1',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const DemoStorage = {
  // Get all subjects
  getSubjects(): ISubject[] {
    return [...demoSubjectsStorage];
  },

  // Add a new subject
  addSubject(subject: ISubject): ISubject {
    demoSubjectsStorage.push(subject);
    return subject;
  },

  // Get subject by ID
  getSubjectById(id: string): ISubject | undefined {
    return demoSubjectsStorage.find(s => s._id.toString() === id);
  },

  // Update subject
  updateSubject(id: string, updates: Partial<ISubject>): ISubject | null {
    const index = demoSubjectsStorage.findIndex(s => s._id.toString() === id);
    if (index === -1) return null;
    
    demoSubjectsStorage[index] = {
      ...demoSubjectsStorage[index],
      ...updates,
      updatedAt: new Date(),
    };
    return demoSubjectsStorage[index];
  },

  // Delete subject
  deleteSubject(id: string): boolean {
    const index = demoSubjectsStorage.findIndex(s => s._id.toString() === id);
    if (index === -1) return false;
    
    demoSubjectsStorage.splice(index, 1);
    return true;
  }
};