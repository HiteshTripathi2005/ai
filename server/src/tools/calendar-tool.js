import { tool } from "ai";
import z from "zod";
import { googleClient } from "../app.js";
import { google } from "googleapis";

const listEvents = tool({
    name: "listEvents",
    description: "A tool for listing events from the user's calendar",
    inputSchema: z.object({
        calendarId: z.string().optional().default("primary").describe("The ID of the calendar to list events from. Default is the primary calendar."),
        maxResults: z.number().optional().default(10).describe("The maximum number of events to return. Default is 10."),
    }),
    execute: async (input) => {
        const { calendarId, maxResults } = input;
        try {
            console.log("REFRESH_TOKEN:", process.env.REFRESH_TOKEN);

            googleClient.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN
            });
            
            console.log("Listing events for calendar:", calendarId);
            const calendar = google.calendar({ version: "v3", auth: googleClient });
            const response = await calendar.events.list({
            calendarId: calendarId,
                maxResults: maxResults,
            });
            console.log("Response from listEvents:", response.data.items);
            return response.data.items;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to list events");
        }
    }
});

const createEvent = tool({
    name: "createEvent",
    description: "A tool for creating an event in the user's calendar",
    inputSchema: z.object({
        calendarId: z.string().optional().default("primary").describe("The ID of the calendar to create the event in. Default is the primary calendar."),
        event: z.object({
            summary: z.string().describe("The summary of the event."),
            description: z.string().optional().describe("The description of the event."),
            start: z.object({
                dateTime: z.string().describe("The start date and time of the event in ISO format."),
                timeZone: z.string().optional().default("UTC").describe("The time zone of the event. Default is UTC."),
            }),
            end: z.object({
                dateTime: z.string().describe("The end date and time of the event in ISO format."),
                timeZone: z.string().optional().default("UTC").describe("The time zone of the event. Default is UTC."),
            }),
        }),
    }),
    execute: async (input) => {
        const { calendarId, event } = input;
        try {
            console.log("Creating event for calendar:", calendarId);
            googleClient.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN
            });
            const calendar = google.calendar({ version: "v3", auth: googleClient });
            const response = await calendar.events.insert({
                calendarId: calendarId,
                requestBody: {
                    summary: event.summary,
                    description: event.description,
                    start: {
                        dateTime: event.start.dateTime,
                        timeZone: event.start.timeZone,
                    },
                    end: {
                        dateTime: event.end.dateTime,
                        timeZone: event.end.timeZone,
                    },
                }
            });
            console.log("Response from createEvent:", response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create event");
        }
    }
});

const deleteEvent = tool({
    name: "deleteEvent",
    description: "A tool for deleting an event from the user's calendar",
    inputSchema: z.object({
        calendarId: z.string().optional().default("primary").describe("The ID of the calendar to delete the event from."),
        eventId: z.string().describe("The ID of the event to delete."),
    }),
    execute: async (input) => {
        const { calendarId, eventId } = input;
        try {
            console.log("Deleting event for calendar:", calendarId);
            googleClient.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN
            });
            const calendar = google.calendar({ version: "v3", auth: googleClient });
            const response = await calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
            });
            console.log("Response from deleteEvent:", response.status);
            return response.status;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to delete event");
        }
    }
});

const listCalendars = tool({
    name: "listCalendars",
    description: "A tool for listing calendars from the user's account",
    inputSchema: z.object({
        maxResults: z.number().optional().default(10),
    }),
    execute: async ( input ) => {
        const { maxResults } = input;
        try {
            console.log("Listing calendars for the user with maxResults:", maxResults);
            googleClient.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN
            });
            const calendar = google.calendar({ version: "v3", auth: googleClient });
            const response = await calendar.calendarList.list({
                maxResults: maxResults,
            });
            console.log("Response from listCalendars:", response.data.items);
            return response.data.items;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to list calendars");
        }
    }
});

const createCalendar = tool({
    name: "createCalendar",
    description: "A tool for creating a calendar in the user's account",
    inputSchema: z.object({
        summary: z.string().describe("The summary of the calendar."),
    }),
    execute: async (input) => {
        const { summary } = input;
        try {
            console.log("Creating calendar for the user:", summary);
            googleClient.setCredentials({
                refresh_token: process.env.REFRESH_TOKEN
            });
            const calendar = google.calendar({ version: "v3", auth: googleClient });
            const response = await calendar.calendars.insert({
                requestBody: { summary: summary }
            });
            console.log("Response from createCalendar:", response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create calendar");
        }
    }
});

const deleteCalendar = tool({
    name: "deleteCalendar",
    description: "A tool for deleting a calendar from the user's account by providing the calendar ID",
    inputSchema: z.object({
        calendarId: z.string().describe("The ID of the calendar to delete."),
    }),
    execute: async (input) => {
        const { calendarId } = input;
        try {
        console.log("Deleting calendar for the user:", calendarId);
        googleClient.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });
        const calendar = google.calendar({ version: "v3", auth: googleClient });
        const response = await calendar.calendars.delete({
            calendarId: calendarId,
        });
        console.log("Response from deleteCalendar:", response.status);
        return response.status;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to delete calendar");
    }
    }
});

export { listEvents, createEvent, listCalendars, deleteEvent, createCalendar, deleteCalendar };