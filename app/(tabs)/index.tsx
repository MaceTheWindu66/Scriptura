import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import  React  from 'react';

export default function Tab() {

    const [data, setData] = useState([]);

    const database = useSQLiteContext();

    const loadData = async() =>{
        const result = await database.getAllAsync(
            `SELECT b.osis, v.chapter, v.verse, v.text
            FROM verses v
            JOIN books b ON b.id = v.book_id
            WHERE b.osis = ? AND v.chapter = ? AND v.verse = ?`,
            ['JHN', 1, 1]
        );
        setData(result);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );


    return (
        <View style={styles.container}>
            <View>
                <Text>{data?.[0]?.text ?? 'Loading...'}</Text>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});