const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const {google} = require('googleapis');
const keys = require('./keys');
const hostname = '127.0.0.1';
const port = 8000;

//define client information from google developer console
const CLIENT_ID = keys.Keys.CLIENT_ID;
const CLIENT_SECRET = keys.Keys.CLIENT_SECRET;
const REDIRECT_URI = keys.Keys.REDIRECT_URI;
const REFRESH_TOKEN = keys.Keys.REFRESH_TOKEN;

//create and complete object 
// const oAuth2client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI);
// oAuth2client.setCredentials({refresh_token: REFRESH_TOKEN});

const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET,REDIRECT_URI);
// Call the setCredentials method on our oAuth2Client instance and set our refresh token.
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
// Create a new calender instance.
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })


// Create a template event for easy creation
class NewCalendarEvent
{
    /**  this is the event templete object
     * @param title -This is the title for the new event.
     * @param location -This is the location of the event.
     * @param description -This is the description of the event.
     * @param colorId -This is the id color for the event
     *  Color: Blue = colorId: 1 ||
     *  Color: Green = colorId: 2 ||
     *  Color: Purple = colorId: 3 ||
     *  Color: Red = colorId: 4 ||
     *  Color: Yellow = colorId: 5 ||
     *  Color: Orange = colorId: 6 ||
     *  Color: Turquoise = colorId: 7 ||
     *  Color: Gray = colorId: 8 ||
     *  Color: Bold Blue = colorId: 9 ||
     *  Color: Bold Green = colorId: 10 ||
     *  Color: bold red = colorId: 11 ||
    */
    constructor(title, location, description, colorId)
    {
        this.summary = title,
        this.location = location,
        this.description = description,
        this.colorId = colorId,
        this.start = {
            dateTime: eventStartTimeEval(0,0),
            timeZone: 'America/Denver',
        },
        this.end = {
            dateTime: eventEndTimeEval(0,0),
            timeZone: 'America/Denver',
        }
    }
}

/**  this is the event templete objects endtime evaluating function for the start date
 * @param day -This sets the day.
 * @param hour -This sets the hour.
*/
function eventStartTimeEval(day,hours) {
  const eventStartTime = new Date();
  eventStartTime.setDate(eventStartTime.getDate());
  eventStartTime.setHours(0, 0,0,0);
  return eventStartTime;
}

/**  this is the event templete objects endtime evaluating function for the end date
 * @param day -This sets the day.
 * @param hour -This sets the hour.
*/
function eventEndTimeEval(day, hour) {
  // Create a new event end date instance for temp uses in our calendar.
  const eventEndTime = new Date();
  eventEndTime.setDate(eventEndTime.getDate()+50);
  eventEndTime.setHours(0, 0,0,0);
  return eventEndTime;
}

//*
// Check if we are busy and add an event on our calendar at the same time.
function addEventToCalendar(fileData){
  let createdEvent = new NewCalendarEvent("testing", "This is date testing", "this is a location", 4);
  calendar.freebusy.query(
    {
      resource: {
        timeMin: createdEvent.start.dateTime,
        timeMax: createdEvent.end.dateTime,
        timeZone: 'America/Denver',
        items: [{ id: 'primary' }],
      },
    },
    (err, res) => {
      // Check for errors in our query and log them if they exist.
      if (err) return console.error('Free Busy Query Error: ', err)

      // Create an array of all events on our calendar during that time.
      const eventArr = res.data.calendars.primary.busy

      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0){
        // If we are not busy create a new calendar event.
        return calendar.events.insert(
          { calendarId: 'primary', resource: createdEvent }, err => {
            // Check for errors and log them if they exist.
            if (err) return console.error('Error Creating Calender Event:', err)
            // Else log that the event was created.
            addedEvent = true;
            return console.log('Calendar event successfully created.')
          }
        );
      } else {
        // If event array is not empty log that we are busy.
        return console.log(`Sorry I'm busy...`);
      }
    }
  );
}
//*/

app.get(/[\s\S]*/, function(req, res) {
  let router = req.url;
  if(router == "/favicon.ico") router = "/";
  if (router.startsWith("/")) {
    fs.readFile("index.html", "utf-8",(err, data)=>{
      addEventToCalendar(data);
      res.send(data);
    });
    return;
  }
});
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});