import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { NewsStory } from '../types/news';

// Sample news stories with bias scoring for testing
const SAMPLE_NEWS_STORIES = [
  {
    title: "Tech Giants Report Record Quarterly Earnings",
    summary: "Major technology companies show strong financial performance despite economic uncertainty, with AI investments driving growth across the sector.",
    content: "Technology giants including Apple, Google, and Microsoft have reported record-breaking quarterly earnings, defying economic headwinds and market volatility. The surge is largely attributed to increased investments in artificial intelligence and cloud computing services.",
    category: "Technology",
    biasScore: {
      left: 25,
      center: 50,
      right: 25
    },
    totalSources: 15,
    sources: [
      {
        id: "cnn-tech",
        name: "CNN Business",
        url: "https://cnn.com/business/tech-earnings",
        bias: "left" as const,
        credibilityScore: 4.2,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: "reuters-tech",
        name: "Reuters",
        url: "https://reuters.com/technology/earnings",
        bias: "center" as const,
        credibilityScore: 4.8,
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: "wsj-tech",
        name: "Wall Street Journal",
        url: "https://wsj.com/tech/quarterly-results",
        bias: "right" as const,
        credibilityScore: 4.6,
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }
    ],
    userVotes: [
      {
        userId: "user1",
        biasVote: "center" as const,
        credibilityVote: 4,
        qualityVote: 5,
        votedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
      },
      {
        userId: "user2",
        biasVote: "center" as const,
        credibilityVote: 5,
        qualityVote: 4,
        votedAt: new Date(Date.now() - 15 * 60 * 1000) // 15 mins ago
      }
    ],
    totalVotes: 2,
    averageCredibility: 4.5,
    averageQuality: 4.5,
    aiSummary: "Multiple sources confirm strong tech earnings with balanced reporting across political spectrum. AI and cloud services identified as key growth drivers.",
    aiCredibilityScore: 0.85,
    aiDetectedBias: "center" as const,
    isBreaking: false,
    isTrending: true,
    isUserGenerated: false,
    viewCount: 1250,
    shareCount: 89,
    bookmarkCount: 156,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
  },
  
  {
    title: "Climate Summit Reaches Historic Agreement",
    summary: "World leaders unite on unprecedented climate action plan, though implementation details spark debate among environmental groups and industry.",
    content: "The latest climate summit has concluded with what many are calling a historic agreement on global carbon reduction targets. However, environmental activists and industry leaders remain divided on the feasibility of proposed timelines.",
    category: "Environment",
    biasScore: {
      left: 60,
      center: 25,
      right: 15
    },
    totalSources: 22,
    sources: [
      {
        id: "guardian-climate",
        name: "The Guardian",
        url: "https://guardian.com/environment/climate-summit",
        bias: "left" as const,
        credibilityScore: 4.3,
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: "bbc-climate",
        name: "BBC News",
        url: "https://bbc.com/news/climate-agreement",
        bias: "center" as const,
        credibilityScore: 4.7,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: "fox-climate",
        name: "Fox News",
        url: "https://foxnews.com/politics/climate-deal",
        bias: "right" as const,\n        credibilityScore: 3.8,\n        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)\n      }\n    ],\n    userVotes: [\n      {\n        userId: \"user3\",\n        biasVote: \"left\" as const,\n        credibilityVote: 4,\n        qualityVote: 4,\n        votedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)\n      }\n    ],\n    totalVotes: 1,\n    averageCredibility: 4.0,\n    averageQuality: 4.0,\n    aiSummary: \"Climate agreement shows strong left-leaning coverage focus. Right-wing sources emphasize economic concerns while left sources highlight environmental urgency.\",\n    aiCredibilityScore: 0.78,\n    aiDetectedBias: \"left\" as const,\n    isBreaking: true,\n    isTrending: false,\n    isUserGenerated: false,\n    viewCount: 2100,\n    shareCount: 245,\n    bookmarkCount: 312,\n    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),\n    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)\n  },\n\n  {\n    title: \"Federal Reserve Announces Interest Rate Decision\",\n    summary: \"Central bank maintains current rates while signaling potential changes ahead, with mixed reactions from financial markets and economic analysts.\",\n    content: \"The Federal Reserve has announced its latest interest rate decision, keeping rates unchanged while providing guidance on future monetary policy direction. Market reactions have been mixed with varying interpretations of the Fed's forward guidance.\",\n    category: \"Finance\",\n    biasScore: {\n      left: 20,\n      center: 45,\n      right: 35\n    },\n    totalSources: 18,\n    sources: [\n      {\n        id: \"nyt-fed\",\n        name: \"New York Times\",\n        url: \"https://nytimes.com/business/federal-reserve\",\n        bias: \"left\" as const,\n        credibilityScore: 4.4,\n        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)\n      },\n      {\n        id: \"ap-fed\",\n        name: \"Associated Press\",\n        url: \"https://apnews.com/business/fed-rates\",\n        bias: \"center\" as const,\n        credibilityScore: 4.9,\n        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)\n      }\n    ],\n    userVotes: [\n      {\n        userId: \"user4\",\n        biasVote: \"center\" as const,\n        credibilityVote: 5,\n        qualityVote: 4,\n        votedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)\n      },\n      {\n        userId: \"user5\",\n        biasVote: \"right\" as const,\n        credibilityVote: 4,\n        qualityVote: 5,\n        votedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)\n      }\n    ],\n    totalVotes: 2,\n    averageCredibility: 4.5,\n    averageQuality: 4.5,\n    aiSummary: \"Fed decision receives balanced coverage with slight right-wing emphasis on market impacts and economic growth concerns.\",\n    aiCredibilityScore: 0.92,\n    aiDetectedBias: \"center\" as const,\n    isBreaking: false,\n    isTrending: true,\n    isUserGenerated: false,\n    viewCount: 980,\n    shareCount: 67,\n    bookmarkCount: 123,\n    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),\n    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)\n  },\n\n  {\n    title: \"Local Community Raises Funds for New Library\",\n    summary: \"Grassroots campaign successfully reaches funding goal for new community library, highlighting local civic engagement and literacy initiatives.\",\n    content: \"A local community has successfully raised funds for a new public library through crowdfunding and volunteer efforts. The initiative demonstrates strong civic engagement and commitment to educational resources.\",\n    category: \"Local\",\n    biasScore: {\n      left: 33,\n      center: 34,\n      right: 33\n    },\n    totalSources: 3,\n    sources: [\n      {\n        id: \"local-news-1\",\n        name: \"Community Herald\",\n        url: \"https://communityherald.com/library-funding\",\n        bias: \"center\" as const,\n        credibilityScore: 3.8,\n        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)\n      }\n    ],\n    userVotes: [],\n    totalVotes: 0,\n    averageCredibility: 0,\n    averageQuality: 0,\n    isBreaking: false,\n    isTrending: false,\n    isUserGenerated: true,\n    submittedBy: \"user6\",\n    viewCount: 45,\n    shareCount: 8,\n    bookmarkCount: 12,\n    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),\n    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)\n  }\n];\n\nexport class SeedDataService {\n  static async seedNewsData(): Promise<void> {\n    try {\n      console.log('🌱 Starting to seed news data...');\n      \n      const newsCollection = collection(db, 'news');\n      \n      for (const story of SAMPLE_NEWS_STORIES) {\n        const storyData = {\n          ...story,\n          createdAt: serverTimestamp(),\n          updatedAt: serverTimestamp(),\n          sources: story.sources.map(source => ({\n            ...source,\n            publishedAt: serverTimestamp()\n          })),\n          userVotes: story.userVotes.map(vote => ({\n            ...vote,\n            votedAt: serverTimestamp()\n          }))\n        };\n        \n        const docRef = await addDoc(newsCollection, storyData);\n        console.log(`✅ Added story: \"${story.title}\" with ID: ${docRef.id}`);\n      }\n      \n      console.log('🎉 Successfully seeded all news data!');\n    } catch (error) {\n      console.error('❌ Error seeding news data:', error);\n      throw error;\n    }\n  }\n\n  static async clearAllNews(): Promise<void> {\n    console.log('🧹 This would clear all news data - implement if needed');\n    // Implementation for clearing data if needed during development\n  }\n}\n\n// Export for easy access\nexport const seedDataService = SeedDataService;"
        }
      ]
    }
  ]"}