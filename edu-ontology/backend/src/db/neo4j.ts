import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

export async function initKnowledgeGraph() {
  const session = driver.session();

  try {
    // Word 노드에 대한 ID 제약조건 생성
    await session.run(`
      CREATE CONSTRAINT word_id IF NOT EXISTS FOR (w:Word) REQUIRE w.id IS UNIQUE
    `);

    // Word 노드에 대한 Fulltext 검색 인덱스 생성
    await session.run(`
      CREATE FULLTEXT INDEX word_search IF NOT EXISTS FOR (w:Word)
      ON EACH PROPERTIES [w.text, w.pos, w.definition]
    `);

    // Relation 타입 제한을 위한 인덱스 생성
    await session.run(`
      CREATE INDEX relation_type IF NOT EXISTS FOR ()-[r:RELATION]-() ON (r.type)
    `);

    console.log('Neo4j knowledge graph initialized successfully');
  } catch (error) {
    console.error('Error initializing Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function closeNeo4jConnection() {
  await driver.close();
}

export { driver };

// Word 노드 생성 함수
export async function createWord(word: {
  id: string;
  text: string;
  pos: string;
  definition: string;
  level?: string;
}) {
  const session = driver.session();

  try {
    const result = await session.run(`
      MERGE (w:Word {id: $id})
      SET w.text = $text,
          w.pos = $pos,
          w.definition = $definition,
          w.level = $level,
          w.created = timestamp()
      RETURN w
    `, word);

    return result.records[0].get('w').properties;
  } catch (error) {
    console.error('Error creating word:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Relation 생성 함수
export async function createRelation(
  wordId1: string,
  wordId2: string,
  relationType: string,
  weight: number = 1.0
) {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (w1:Word {id: $wordId1})
      MATCH (w2:Word {id: $wordId2})
      MERGE (w1)-[r:RELATION {type: $relationType}]->(w2)
      SET r.weight = $weight,
          r.created = timestamp()
      RETURN r
    `, { wordId1, wordId2, relationType, weight });

    return result.records[0].get('r').properties;
  } catch (error) {
    console.error('Error creating relation:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Gap 데이터 조회 함수
export async function getStudentGaps(studentId: string) {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (s:Student {id: $studentId})
      MATCH (s)-[w:WEAKNESS]->(word:Word)
      RETURN word.text, word.pos, w.strength, w.frequency
      ORDER BY w.frequency DESC
    `, { studentId });

    return result.records.map(record => ({
      word: record.get('word.text'),
      pos: record.get('word.pos'),
      strength: record.get('w.strength'),
      frequency: record.get('w.frequency')
    }));
  } catch (error) {
    console.error('Error getting student gaps:', error);
    throw error;
  } finally {
    await session.close();
  }
}