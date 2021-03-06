const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const {google} = require('googleapis');
const keys = require('./keys');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
const hostname = '127.0.0.2';
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
     * @param start.day -This sets the starting day from the current date
     * @param start.hour -This sets the starting hour
     * @param end.day -This sets the ending day from the current date
     * @param end.hour -This sets the ending hour
    */
    constructor(title, location, description, colorId, start = {day, hour}, end = {day, hour})
    {
      if(start == undefined || end == undefined) throw `starting time invalid\n ${start.day}\n ${start.hour}\n ${end.day}\n ${end.hour}`;
        this.summary = title,
        this.location = location,
        this.description = description,
        this.colorId = colorId,
        this.start = {
            dateTime: eventStartTimeEval(start.day,start.hour),
            timeZone: 'America/Denver',
        },
        this.end = {
            dateTime: eventEndTimeEval(end.day,end.hour),
            timeZone: 'America/Denver',
        }
    }
}

/**  this is the event templete objects endtime evaluating function for the start date
 * @param day -This sets the day.
 * @param hour -This sets the hour.
*/
function eventStartTimeEval(day,hour) {
  const eventStartTime = new Date();
  eventStartTime.setDate(eventStartTime.getDate() + day);
  eventStartTime.setHours(hour, 0,0,0);
  return eventStartTime;
}

/**  this is the event templete objects endtime evaluating function for the end date
 * @param day -This sets the day.
 * @param hour -This sets the hour.
*/
function eventEndTimeEval(day, hour) {
  // Create a new event end date instance for temp uses in our calendar.
  const eventEndTime = new Date();
  eventEndTime.setDate(eventEndTime.getDate() + day);
  eventEndTime.setHours(hour, 0,0,0);
  return eventEndTime;
}

// Check if we are busy and add an event on our calendar at the same time.
function addEventToCalendar(req, res, fileData){
  let createdEvent = new NewCalendarEvent(req.Name, req.Location, req.Description, Number(req.colorId), {day:Number(req.startd), hour:Number(req.starth) },{day:Number(req.endd), hour:Number(req.endh)});
  calendar.freebusy.query(
    {
      resource: {
        timeMin: createdEvent.start.dateTime,
        timeMax: createdEvent.end.dateTime,
        timeZone: 'America/Denver',
        items: [{ id: 'primary' }],
      },
    },
    (err, sult) => {
      // Check for errors in our query and log them if they exist.
      if (err) return console.error('Free Busy Query Error: ', err)

      // Create an array of all events on our calendar during that time.
      const eventArr = sult.data.calendars.primary.busy

      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0){
        // If we are not busy create a new calendar event.
        return calendar.events.insert({ calendarId: 'primary', resource: createdEvent }, err => {
            // Check for errors and log them if they exist.
            if (err) return console.error('Error Creating Calender Event:', err)
            // Else log that the event was created.
            addedEvent = true;
            return res.send(fileData);//console.log('Calendar event successfully created.');
          }
        );
      } else {
        // If event array is not empty log that we are busy.
        return res.send("You have an event there already."); //console.log(`Sorry I'm busy...`);
      }
    }
  );
}

function getCalendarInfo(res, data) {
  let output = [];
  let pageInput = [];
    let rowTemplete = `<tr>
    <td>Event Name</td>
    <td>Description</td>
    <td>Event Start Date</td>
    <td>Event End Date</td>
    <td>Event Location</td>
    <td>Status</td>
    <td>Creator</td>
</tr>`;
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date(new Date().setHours(0,0,0))).toISOString(),
    timeMax:(new Date(new Date().setHours(23,59,59,0))).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, sult) => {
    if (err) throw console.log('The API returned an error: ' + err);
    const events = sult.data.items;
    if (events.length) {
      events.map((event, i) => {
        output.push(event);
      });
      //console.log(output);
      output.forEach(selectedEvent => {
        let temp = rowTemplete;
        temp = temp.replace("Event Name", selectedEvent.summary);
        temp = temp.replace("Description", selectedEvent.description);
        temp = temp.replace("Event Start Date", new Date(selectedEvent.start.dateTime).toLocaleTimeString());
        temp = temp.replace("Event End Date", new Date(selectedEvent.end.dateTime).toLocaleTimeString());
        temp = temp.replace("Event Location", selectedEvent.location);
        temp = temp.replace("Status", selectedEvent.status);
        temp = temp.replace("Creator", selectedEvent.creator.email);
        pageInput.push(temp);
      });
      data = data.replace(`^/^input^/^`, pageInput);
      res.send(data);
      return
    } else {
      data = data.replace(`^/^input^/^`, `<tr>
      <td>no</td>
      <td>events</td>
      <td>for</td>
      <td>a</td>
      <td>while,</td>
      <td>good</td>
      <td>job</td>
  </tr>`);
      res.send(data);
    }
  });
  
}


app.post('/addEvent',function(req,res) {
  // console.log(req.body);
  // var username = req.body.Name;
  // var htmlData = 'Hello:' + username;
  // res.send(htmlData);
  // console.log(htmlData);
  fs.readFile("redirect.html", "utf-8",(err, data)=>{
    //console.log(req.query);  //debug input
    addEventToCalendar(req.body, res, data);
  });
});

app.get("/", function(req, res) {
  fs.readFile("index.html", "utf-8",(err, data)=> {
    getCalendarInfo(res, data);
  });
});


app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});