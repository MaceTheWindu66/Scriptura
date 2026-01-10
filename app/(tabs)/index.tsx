import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import  React  from 'react';

type VerseRow = {
    osis: string;
    chapter: number;
    verse: number;
    text: string;
};

export default function Tab() {

    const [data, setData] = useState<VerseRow[]>([]);
    const [chapter, setChapter] = useState(1);

    const database = useSQLiteContext();

    const loadData = async() =>{
        const result = await database.getAllAsync<VerseRow>(
            `SELECT b.osis, v.chapter, v.verse, v.text
            FROM verses v
            JOIN books b ON b.id = v.book_id
            WHERE b.osis = ? AND v.chapter = ?`,
            ['MRK', chapter]
        );
        console.log(result)
        setData(result);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );


    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.chapter_container}>
                    <ScrollView style={styles.chapter_container}>
                        <Text style={styles.verse_text}>
                            {data.map((v) => (
                            <Text key={`${v.osis}:${v.chapter}:${v.verse}`}>
                                <Text style={styles.verseNumber}>{v.verse} </Text>
                                {v.text + ' '}
                            </Text>
                            ))}
                        </Text>
                    </ScrollView>
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
        lineHeight: 30,
    },

    verseNumber: {
        fontWeight: '600',
        fontSize: 12,
    },

});