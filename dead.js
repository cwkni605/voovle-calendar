app.get("/", function(req, res) {
    fs.readFile("index.html", "utf-8",(err, data)=> {
      let pageInput = [];
      let rowTemplete = `<tr>
      <th>Event Name</th>
      <th>Description</th>
      <th>Event Start Date</th>
      <th>Event End Date</th>
      <th>Event Location</th>
      <th>Status</th>
      <th>Creator</th>
  </tr>`
      let events = getCalendarInfo();
      console.log('GET: ' + events);
      events.forEach(selectedEvent => {
        console.log('GET: ' + selectedEvent);
        let temp = rowTemplete;
        temp = temp.replace("Event Name", selectedEvent.summary);
        temp = temp.replace("Description", selectedEvent.description);
        temp = temp.replace("Event Start Date", selectedEvent.start.dateTime);
        temp = temp.replace("Event End Date", selectedEvent.end.dateTime);
        temp = temp.replace("Event Location", selectedEvent.location);
        temp = temp.replace("Status", selectedEvent.status);
        temp = temp.replace("Creator", selectedEvent.creator.email);
        console.log('GET: ' + temp);
      });
      data = data.replace(`^/^input^/^`);
      res.send(data);
    });
  });