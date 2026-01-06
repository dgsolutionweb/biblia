
export interface Verse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleResponse {
  reference: string;
  verses: Verse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export interface BookInfo {
  name: string;
  chapters: number;
  id: string;
  apiName: string;
  aliases?: string[];
}

export interface SummaryResult {
  title: string;
  content: string;
  keyPoints: string[];
  historicalContext: string;
}
