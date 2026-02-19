import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      return []
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()

    return chats
  },
})

export const get = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      return null
    }

    const chat = await ctx.db.get(args.chatId)
    if (!chat || chat.userId !== user._id) {
      return null
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect()

    return { ...chat, messages }
  },
})

export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error("Not authenticated")
    }

    const chatId = await ctx.db.insert("chats", {
      userId: user._id,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return chatId
  },
})

export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error("Not authenticated")
    }

    const chat = await ctx.db.get(args.chatId)
    if (!chat || chat.userId !== user._id) {
      throw new Error("Chat not found")
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect()

    for (const message of messages) {
      await ctx.db.delete(message._id)
    }

    await ctx.db.delete(args.chatId)
  },
})

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error("Not authenticated")
    }

    const chat = await ctx.db.get(args.chatId)
    if (!chat || chat.userId !== user._id) {
      throw new Error("Chat not found")
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    })

    // Update chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    })

    return messageId
  },
})
