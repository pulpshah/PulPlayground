import neo4j from 'neo4j-driver';

// Store your connection details in environment variables
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";

// Initialize the Neo4j driver (singleton)
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
  { disableLosslessIntegers: true } // Makes it easier to handle numeric values in JS
);

// Export a helper to create sessions easily
export function getNeo4jSession(mode: 'READ' | 'WRITE' = 'WRITE') {
  return driver.session({ defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE });
}

export default driver;
