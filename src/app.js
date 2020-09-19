const express = require("express");
const cors = require("cors");

const { v4: uuid } = require('uuid');
const os = require('os');
const { TestScheduler } = require("jest");

const app = express();


/** 
 * MIDDLEWARES section
 */

/** Log Requests
 * * log request infos on console server
 * 
 * @param {any} request: Requests data recieved in endpoint.
 * @param {any} response: Response data sended by endpoint.
 * @param {any} next: Next instruction or endpoint.
 */
function logRequests(request, response, next) {
  const { method, url } = request;

  const logLabel = `[${method.toUpperCase()}] ${url}`;

  console.time(logLabel);

  next();

  console.timeEnd(logLabel);
}

app.use(logRequests);

app.use(express.json());
app.use(cors());

const repositories = [];

/**
 * ENDPOINTS section
 */

/** Who am I?
 * Return basic info about server OS
 * // Only for hello world purpose  
 */
app.get('/whoami', (request, response) => {
  return response.json({
    hostname: os.hostname(),
    type: os.type(),
    arch: os.arch(),
    platform: os.platform()
  });
});

/** [Get] repositories
 * 
 * Return repositories dto
 * * Query Fiters:
 *    * id = filter result by id (uiid). This param's exclusively
 *    * title = filter result by title's match. Don't need all title, but some words or part is enough.
 *    * tech = filter result by technology. Need match all world.
 */
app.get("/repositories", (request, response) => {
  const { id, title, tech } = request.query;

  let data = [];

  if (id) {
    data = repositories.filter(repository => repository.id === id);
  } else {
    data = repositories;

    data = title
      ? repositories.filter(repository => repository.title.toLowerCase().includes(title.toLowerCase()))
      : repositories;

    data = tech
      ? data.filter(repository => repository.techs.map(t => t.toLowerCase()).includes(tech.toLowerCase()))
      : data;
  }

  return response.json(data);
});

/** [Post] repositories
 * Add new repository
 * 
 * Record a new repository starting with zero likes and
 *  if created, will 
 *    return it as 201 - Created with content sended in return with id and zero liked
 *  if repository url is already included in another repository:
 *    return a 400 bad request with message return: { code: 001, reason: 'This url is already included before' }
 * 
 * * content object format:
 *  * title = title of the repository
 *  * url = url for the repository
 *  * 
 */
app.post("/repositories", (request, response) => {
  const { title, url, techs } = request.body;

  if (repositories.filter(repository => repository.url === url).length === 0) {

    const repository = { id: uuid(), title, url, techs, likes: 0, dislikes: 0 };

    repositories.push(repository);

    return response.status(201).json(repository);
  } else {
    return response.status(400).json({ code: "002", reason: "This url is already included before." });
  }

});

/** [Put] repositories
 * Update repository
 * 
 * Update existing repository with new title, url and techs
 * * if ID not exists, return error
 * * if URL already exist in another repo, return error
 * 
 * @returns 204 - Created No Content
 * @returns 400 - Bad Request: { code: "001", reason: "This url is already included before." }
 * @returns 400 - Bad Request: { code: "002", reason: "Repository not found." }
 */
app.put("/repositories/:id", (request, response) => {
  const { id } = request.params;
  const { title, url, techs } = request.body;

  const ix = repositories.findIndex(r => r.id === id);

  if (ix >= 0) {
    if (repositories.filter(r => r.url === url && r.id !== id).length === 0) {

      const repository = { id, title, url, techs, likes: repositories[ix].likes, dislikes: repositories[ix].dislikes };

      repositories[ix] = repository;

      return response.status(204).send();
    } else {
      return response.status(400).json({ code: "002", reason: "This url is already included before." });
    }
  } else {
    return response.status(400).json({ code: "001", reason: 'Repository not found.' });
  }

});

/** [Delete] repositories
 * Delete existing repository searched by ID 
 * 
 */
app.delete("/repositories/:id", (request, response) => {
  const { id } = request.params;

  const ix = repositories.findIndex(r => r.id === id);

  if (ix >= 0) {
    repositories.splice(ix, 1);

    return response.status(204).send();
  } else {
    return response.status(400).json({ code: "001", reason: 'Repository not found.' });
  }

});

/** [Post] repositories 
 * Create a like in repository searched by ID
 * 
 */
app.post("/repositories/:id/like", (request, response) => {
  const { id } = request.params;

  const ix = repositories.findIndex(r => r.id === id);

  if (ix >= 0) {
    repositories[ix].likes++;

    return response.status(204).send();
  } else {
    return response.status(400).json({ code: "001", reason: 'Repository not found.' });
  }

});

/** [Post] repositories 
 * Remove a like in repository searched by ID
 * 
 */
app.post("/repositories/:id/dislike", (request, response) => {
  const { id } = request.params;

  const ix = repositories.findIndex(r => r.id === id);

  if (ix >= 0) {
    repositories[ix].dislikes++;

    return response.status(204).send();
  } else {
    return response.status(400).json({ code: "001", reason: 'Repository not found.' });
  }

});

module.exports = app;
