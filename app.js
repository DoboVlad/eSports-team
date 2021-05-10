const express = require('express')
const app = express()
const cors = require('cors')
const sparql = require('sparql-http-client');
const bodyParser = require('body-parser');
const port = 4000;

// pentru a prelua elemente din body
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());
let endpointUrl = "http://localhost:8080/rdf4j-server/repositories/grafexamen";

app.get('/', async (req, res) => {
  let numeRegiuni = [];
  const query = `
  PREFIX : <http://mariavlad.ro#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX schema: <http://schema.org/>
  SELECT ?nume
  WHERE
  {
      ?regiune a schema:DefinedRegion.
      ?regiune rdfs:label ?nume
  }`;
  const client = new sparql({ endpointUrl });
  const stream = await client.query.select(query);

  stream.on('data', row => {
    numeRegiuni.push(row.nume.value);
  });

  stream.on('error', err => {
    console.error(err)
  });

  stream.on('end', row => {
    res.send(numeRegiuni);
  });
});

app.get('/region/:regiune', async (req, res) => {
  let echipe = [];
  const query = `
  PREFIX : <http://mariavlad.ro#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  SELECT ?nume ?finalist ?nrMembrii ?imagine
  WHERE
  {
    ?echipa :from :${req.params.regiune};
  	        :finalist ?finalist;
            :nrMembrii ?nrMembrii;
            :img ?imagine;
            rdfs:label ?nume
  }`;
  const client = new sparql({ endpointUrl });
  const stream = await client.query.select(query);

  stream.on('data', row => {
    echipe.push(
    {
    "finalist": row.finalist.value,
    "nrMembrii":row.nrMembrii.value,
    "imagine": row.imagine.value,
    "nume":row.nume.value
    });
  });

  stream.on('error', err => {
    console.error(err)
  });

  stream.on('end', row => {
    res.send(echipe);
  });
});

app.post('/region', async (req, res) => {
  const newId = req.body.nume.split(" ").join('');
  console.log(newId);
  const queryConstruct = `
  PREFIX : <http://mariavlad.ro#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  ASK
	{
		:${newId} ?proprietate ?valoare
	}`;

  const client = new sparql({ endpointUrl });
  const stream = await client.query.ask(queryConstruct);

  if(stream){
    res.send({"eroare": "ID deja existent in graf"});
  } else {
    const query = `
      PREFIX : <http://mariavlad.ro#>
      PREFIX schema: <http://schema.org/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      INSERT DATA{
        GRAPH :grafEchipe{
          :${newId} :from :${req.body.from};
                              :finalist ${req.body.finalist};
                              :nrMembrii ${req.body.nrMembrii};
                              :img "${req.body.imagine}";
                              rdfs:label "${req.body.nume}";
                              a schema:SportsTeam.
        }}`;

    try{
      const updateUrl = endpointUrl + "/statements";
      const client = new sparql({ updateUrl });
      const stream = await client.query.update(query);
      res.status(200).send({"mesaj": "Inserare efectuata cu succes"});

    } catch(e) {
      console.log(e);
    }
  }});

app.post('/delete', async (req, res) => {
    const newId = req.body.nume.split(" ").join('');
    const queryConstruct = `
    PREFIX : <http://mariavlad.ro#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    ASK
    {
      :${newId} ?proprietate ?valoare
    }`;

    const client = new sparql({ endpointUrl });
    const stream = await client.query.ask(queryConstruct);

    if(!stream){
      res.send({"eroare": "Echipa nu exista in baza de date"});
    } else {
      const query = `
      PREFIX : <http://mariavlad.ro#>
      PREFIX schema: <http://schema.org/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      DELETE {
        :${newId} :from ?Region;
                :finalist ?finalist;
                :nrMembrii ?nr;
                :img ?img;
                rdfs:label ?nume;
                a schema:SportsTeam.
      }
      WHERE
      {
        :${newId} :from ?Region;
                :finalist ?finalist;
                :nrMembrii ?nr;
                :img ?img;
                rdfs:label ?nume;
                a schema:SportsTeam.
      }`;

      try{
        const updateUrl = endpointUrl + "/statements";
        const client = new sparql({ updateUrl });
        const stream = await client.query.update(query);
        res.status(200).send({"mesaj": "Delete efectuat cu succes"});

      } catch(e) {
        console.log(e);
      }
    }});

app.listen(port, () => {
  console.log("Application started");
});
