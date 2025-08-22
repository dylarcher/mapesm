// GraphQL API Pattern - Schema Type Definitions
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # Scalar types
  scalar Date
  scalar JSON
  scalar Upload

  # User types
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    role: UserRole!
    posts: [Post!]!
    comments: [Comment!]!
    followers: [User!]!
    following: [User!]!
    followerCount: Int!
    followingCount: Int!
    postCount: Int!
    isFollowing: Boolean
    createdAt: Date!
    updatedAt: Date!
  }

  enum UserRole {
    ADMIN
    MODERATOR
    USER
    GUEST
  }

  # Post types
  type Post {
    id: ID!
    title: String!
    content: String!
    excerpt: String
    slug: String!
    status: PostStatus!
    author: User!
    comments: [Comment!]!
    tags: [Tag!]!
    likes: [Like!]!
    likeCount: Int!
    commentCount: Int!
    viewCount: Int!
    isLiked: Boolean
    featuredImage: String
    publishedAt: Date
    createdAt: Date!
    updatedAt: Date!
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # Comment types
  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    parent: Comment
    replies: [Comment!]!
    replyCount: Int!
    likes: [Like!]!
    likeCount: Int!
    isLiked: Boolean
    createdAt: Date!
    updatedAt: Date!
  }

  # Tag types
  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    posts: [Post!]!
    postCount: Int!
    color: String
    createdAt: Date!
  }

  # Like types
  type Like {
    id: ID!
    user: User!
    post: Post
    comment: Comment
    createdAt: Date!
  }

  # Notification types
  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    user: User!
    read: Boolean!
    data: JSON
    createdAt: Date!
  }

  enum NotificationType {
    NEW_FOLLOWER
    NEW_COMMENT
    NEW_LIKE
    POST_PUBLISHED
    MENTION
  }

  # Input types
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    avatar: Upload
  }

  input UpdateUserInput {
    name: String
    email: String
    avatar: Upload
  }

  input CreatePostInput {
    title: String!
    content: String!
    excerpt: String
    slug: String
    tags: [String!]
    featuredImage: Upload
    status: PostStatus = DRAFT
    publishedAt: Date
  }

  input UpdatePostInput {
    title: String
    content: String
    excerpt: String
    slug: String
    tags: [String!]
    featuredImage: Upload
    status: PostStatus
    publishedAt: Date
  }

  input CreateCommentInput {
    content: String!
    postId: ID!
    parentId: ID
  }

  input UpdateCommentInput {
    content: String!
  }

  # Filter and pagination inputs
  input UserFilters {
    role: UserRole
    search: String
    createdAfter: Date
    createdBefore: Date
  }

  input PostFilters {
    status: PostStatus
    authorId: ID
    tags: [String!]
    search: String
    publishedAfter: Date
    publishedBefore: Date
  }

  input CommentFilters {
    postId: ID
    authorId: ID
    parentId: ID
  }

  input PaginationInput {
    first: Int = 20
    after: String
    last: Int
    before: String
  }

  input SortInput {
    field: String!
    order: SortOrder = ASC
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Connection types for pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type CommentConnection {
    edges: [CommentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CommentEdge {
    node: Comment!
    cursor: String!
  }

  # Query root type
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(
      filters: UserFilters
      pagination: PaginationInput
      sort: SortInput
    ): UserConnection!
    searchUsers(query: String!): [User!]!

    # Post queries
    post(id: ID, slug: String): Post
    posts(
      filters: PostFilters
      pagination: PaginationInput
      sort: SortInput
    ): PostConnection!
    searchPosts(query: String!): [Post!]!
    popularPosts(limit: Int = 10): [Post!]!
    trendingPosts(limit: Int = 10): [Post!]!

    # Comment queries
    comment(id: ID!): Comment
    comments(
      filters: CommentFilters
      pagination: PaginationInput
      sort: SortInput
    ): CommentConnection!

    # Tag queries
    tag(id: ID, slug: String): Tag
    tags(limit: Int = 50): [Tag!]!
    popularTags(limit: Int = 20): [Tag!]!

    # Notification queries
    notifications(
      unreadOnly: Boolean = false
      limit: Int = 20
    ): [Notification!]!
    unreadNotificationCount: Int!

    # Analytics queries
    analytics: Analytics
    userStats(userId: ID!): UserStats
    postStats(postId: ID!): PostStats
  }

  # Mutation root type
  type Mutation {
    # Authentication mutations
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
    refreshToken: AuthPayload!
    resetPassword(email: String!): Boolean!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!

    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    followUser(userId: ID!): User!
    unfollowUser(userId: ID!): User!

    # Post mutations
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post!
    archivePost(id: ID!): Post!
    likePost(postId: ID!): Like!
    unlikePost(postId: ID!): Boolean!

    # Comment mutations
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, input: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
    likeComment(commentId: ID!): Like!
    unlikeComment(commentId: ID!): Boolean!

    # Tag mutations
    createTag(name: String!, description: String): Tag!
    updateTag(id: ID!, name: String, description: String): Tag!
    deleteTag(id: ID!): Boolean!

    # Notification mutations
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!

    # File upload mutations
    uploadFile(file: Upload!): FileUploadResult!
    deleteFile(url: String!): Boolean!
  }

  # Subscription root type
  type Subscription {
    # User subscriptions
    userCreated: User!
    userUpdated(userId: ID): User!
    userDeleted: ID!

    # Post subscriptions
    postCreated(authorId: ID): Post!
    postUpdated(postId: ID): Post!
    postDeleted: ID!
    postPublished: Post!

    # Comment subscriptions
    commentCreated(postId: ID!): Comment!
    commentUpdated(commentId: ID): Comment!
    commentDeleted: ID!

    # Like subscriptions
    postLiked(postId: ID!): Like!
    commentLiked(commentId: ID!): Like!

    # Notification subscriptions
    notificationReceived(userId: ID!): Notification!

    # Real-time activity
    activityFeed(userId: ID): ActivityEvent!
  }

  # Additional types
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
    expiresAt: Date!
  }

  type FileUploadResult {
    url: String!
    filename: String!
    mimetype: String!
    size: Int!
  }

  type Analytics {
    totalUsers: Int!
    totalPosts: Int!
    totalComments: Int!
    totalLikes: Int!
    dailyActiveUsers: Int!
    monthlyActiveUsers: Int!
    topPosts: [Post!]!
    topUsers: [User!]!
  }

  type UserStats {
    totalPosts: Int!
    totalComments: Int!
    totalLikes: Int!
    totalFollowers: Int!
    totalFollowing: Int!
    joinedDaysAgo: Int!
  }

  type PostStats {
    totalViews: Int!
    totalLikes: Int!
    totalComments: Int!
    totalShares: Int!
    engagementRate: Float!
  }

  type ActivityEvent {
    id: ID!
    type: ActivityType!
    user: User!
    data: JSON!
    timestamp: Date!
  }

  enum ActivityType {
    USER_JOINED
    POST_CREATED
    POST_LIKED
    COMMENT_CREATED
    USER_FOLLOWED
    POST_SHARED
  }
`;
