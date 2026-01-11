import { useFocusEffect } from 'expo-router';
import { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Modal, Pressable } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import  React  from 'react';

// Osis codes to be mapped to books
type OsisCode =
        | "MRK" | "JHN" | "MAT" | "ROM" | "1CO" | "2CO"
        | "GAL" | "EPH" | "PHP" | "COL" | "TIT" | "PHM"
        | "HEB" | "JAS" | "JUD" | "REV"
        | "1TM" | "2TM" | "1TH" | "2TH"
        | "1PE" | "2PE"
        | "1JN" | "2JN" | "3JN";

type VerseRow = {
    osis: OsisCode;
    chapter: number;
    verse: number;
    text: string;
};

type GreekTokenWithLexiconRow = {
  position: number;
  surface: string;
  lemma: string;
  lemma_grc: string;
  morph: string;
  strongs: string | null;
  pos: string | null;

  transliteration: string | null;
  part_of_speech: string | null;
  short_gloss: string | null;
  definition: string | null;
};

type GreekTokenRow = {
  position: number;
  surface: string;
  lemma: string;
  morph: string;
  strongs: string | null;
  pos: string | null;
};

type VerseBaseRow = {
  verse_id: number;
  osis: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type VerseInsightRow = {
  kind: string;
  summary: string;
  details: string | null;
};


type VerseDetails = {
  verse: VerseBaseRow;
  greek: GreekTokenWithLexiconRow[];
  insights: VerseInsightRow[];
};



export default function Tab() {

    // Book maps to map to book osis from sql query to actual name

    const bookNameMap: Record<OsisCode, string> = {
        "MRK": "Mark",
        "JHN": "John",
        "1CO": "1 Corinthians",
        "MAT": "Matthew",
        "2CO": "2 Corinthias",
        "ROM": "Romans",
        "GAL": "Galatians",
        "EPH": "Ephesians",
        "PHP": "Philippians",
        "COL": "Colossians",
        "TIT": "Titus",
        "PHM": "Philemon",
        "HEB": "Hebrews",
        "JAS": "James",
        "JUD": "Jude",
        "REV": "Revelations",
        "1TM": "1 Timothy",
        "2TM": "2 Timothy",
        "1TH": "1 Thessalonians",
        "2TH": "2 Thessalonians",
        "1PE": "1 Peter",
        "2PE": "2 Peter",
        "1JN": "1 John",
        "2JN": "2 John",
        "3JN": "3 John",
    }


    const [data, setData] = useState<VerseRow[]>([]);
    const [chapter, setChapter] = useState(1);
    const [selectedVerse, setSelectedVerse] = useState<VerseRow | null>(null)
    

    const database = useSQLiteContext() as SQLiteDatabase;

    const loadData = React.useCallback(async () => {
        const result = await database.getAllAsync<VerseRow>(
            `SELECT b.osis, v.chapter, v.verse, v.text
            FROM verses v
            JOIN books b ON b.id = v.book_id
            WHERE b.osis = ? AND v.chapter = ?`,
            ['MRK', chapter]
        );
        console.log(result);
        setData(result);
    }, [database, chapter]);

    const [selectedDetails, setSelectedDetails] = useState<VerseDetails | null>(null);

    const onVersePress = async (v: VerseRow) => {
        setSelectedVerse(v);
        const details = await getVerseDetails(database, v.osis, v.chapter, v.verse);
        console.log(details?.greek?.slice(0, 5));
        setSelectedDetails(details);
    }; 

    async function getVerseDetails(
        db: SQLiteDatabase, // expo-sqlite type is fine too; keeping simple here
        osis: string,
        chapter: number,
        verse: number
    ): Promise<VerseDetails | null> {
        // 1) Base verse + verse_id
        const base = await db.getFirstAsync<VerseBaseRow>(
            `SELECT v.id AS verse_id, b.osis, b.name AS book_name, v.chapter, v.verse, v.text
            FROM verses v
            JOIN books b ON b.id = v.book_id
            WHERE b.osis = ? AND v.chapter = ? AND v.verse = ?;`,
            [osis, chapter, verse]
        );

        if (!base) return null;

        // 2) Greek tokens + lexicon
        const greek = await db.getAllAsync<GreekTokenWithLexiconRow>(
            `SELECT gt.position, gt.surface, gt.lemma, gt.morph, gt.strongs, gt.pos, gt.lemma_grc,
                    lx.transliteration, lx.part_of_speech, lx.short_gloss, lx.definition
            FROM greek_tokens gt
            LEFT JOIN lexicon lx ON lx.strongs = gt.strongs
            WHERE gt.verse_id = ?
            ORDER BY gt.position;`,
            [base.verse_id]
        );

        // 3) Insights
        const insights = await db.getAllAsync<VerseInsightRow>(
            `SELECT kind, summary, details
            FROM verse_insights
            WHERE verse_id = ?
            ORDER BY kind;`,
            [base.verse_id]
        );

        return { verse: base, greek, insights };
        }

    

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [loadData])
    );


    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.chapter_container}>
                    <ScrollView style={styles.chapter_container}>
                        <Text style={styles.verse_text}>
                            {data.map((v) => (
                            <Text key={`${v.osis}:${v.chapter}:${v.verse}`}
                                  onPress={() => onVersePress(v)}
                                  style={styles.verseTapArea}>
                                <Text style={styles.verseNumber}>{v.verse} </Text>
                                {v.text + ' '}
                            </Text>
                            ))}
                        </Text>
                    </ScrollView>
                    <Modal
                        visible={selectedVerse !== null}
                        transparent
                        animationType="fade"
                        onRequestClose={() => {setSelectedVerse(null); setSelectedDetails(null)} }
                    >
                        <Pressable style={styles.backdrop} onPress={() => {setSelectedVerse(null); setSelectedDetails(null);}} />
                        
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>
                                {selectedVerse ? `${bookNameMap[selectedVerse.osis]} ${selectedVerse.chapter}:${selectedVerse.verse}`:``}
                            </Text>
                            <Text style={styles.greekText}>{selectedDetails
                                ? selectedDetails.greek.map(t => t.lemma_grc).join(' ')
                                : 'Loading Greek…'}
                            </Text>
                            <Text style={styles.modalText}>{selectedVerse ? `${selectedVerse.text}`: ``}</Text>
                        </View>

                    </Modal>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapter_container: {
        flex: 1,
        padding: 10,
    },
    verse_text: {
        fontSize: 16,
        lineHeight: 32,
    },

    verseNumber: {
        fontWeight: '600',
        fontSize: 12,
    },
    verseTapArea: {},
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    modalTitle: {
        fontWeight: 700,
        fontSize: 24,
        paddingBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
    },
    modalCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        flex: 1,
        justifyContent: 'center'
  },
  modalText: {
    fontWeight: 400,
    fontSize: 14
  },
  greekText: {
    fontWeight: 500,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24
  }
});