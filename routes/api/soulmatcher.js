const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const geolib = require('geolib');
const jwt_check = require('../../utils/jwt_check');
const u_search = require('../../utils/user_search');

//Connect to db
let connection = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'root',
  database: 'matcha'
});

connection.connect(function (err) {
  if (err) throw err
  console.log('You are now connected...')
});


router.post('/', (req, res) => {

  const user = jwt_check.getUsersInfos(req.headers.authorization);
  if (user.id === -1) {
    return res.status(401).json({error: 'unauthorized access'});
  }

  let request = {
    sort: req.body.sort,
    order: req.body.order,
    ageMin: req.body.ageMin,
    ageMax: req.body.ageMax,
    popularityMin: req.body.popularityMin,
    popularityMax: req.body.popularityMax,
    distanceMin: req.body.distanceMin,
    distanceMax: req.body.distanceMax,
    interests: req.body.interests
  };

  if (typeof req.body.sort == 'undefined' || (req.body.sort !== 'relevance' && req.body.sort !== 'age' && req.body.sort !== 'distance' && req.body.sort !== 'popularity' && req.body.sort !== 'interests')|| typeof req.body.order == 'undefined' || (req.body.order !== 'asc' && req.body.order !== 'desc') || typeof req.body.ageMin == 'undefined' || isNaN(req.body.ageMin) || req.body.ageMin === '' || typeof req.body.ageMax == 'undefined' || isNaN(req.body.ageMax) || req.body.ageMax === '' || req.body.ageMin > req.body.ageMax || typeof req.body.popularityMin == 'undefined' || isNaN(req.body.popularityMin) || req.body.popularityMin === '' || typeof req.body.popularityMax == 'undefined' || isNaN(req.body.popularityMax) || req.body.popularityMax === ''|| req.body.popularityMax < req.body.popularityMin || typeof req.body.distanceMin == 'undefined' || isNaN(req.body.distanceMin)|| req.body.distanceMin === '' || typeof req.body.distanceMax == 'undefined' || isNaN(req.body.distanceMax) || req.body.distanceMax === '' || req.body.distanceMax < req.body.distanceMin || typeof req.body.interests == 'undefined' || !Array.isArray(req.body.interests)) {
    return res.status(400).json({
      request: "Erreur dans les champs de recherche"
    })
  }
  const sql = "SELECT age, bio, profile_pic from infos " +
    `WHERE user_id = ${user.id};`;
  connection.query(sql, (err, first_result) => {
    if (err) throw err;
    if (!first_result || !first_result.length || first_result[0].age === null || first_result[0].profile_pic === null || first_result[0].bio === null) {
      return res.status(400).json({
        user: "Vous devez compléter votre profil étendu"
      })
    }
    let sort_function;
    //get sexuality infos from user
    const sql_user_info = "SELECT sexuality, gender FROM infos " +
      `WHERE user_id = ${user.id}`;
    connection.query(sql_user_info, (err, result) => {
      if (err) throw err;

      //if user is found, chose next query depending on sexuality and gender;
      let sql_main_query = "SELECT u.id, i.latitude, i.longitude, i.popularity " +
        `FROM users u INNER JOIN infos i on i.user_id = u.id WHERE u.id != ${user.id} AND `;

      if (result[0].sexuality == "heterosexual")
        sql_main_query += `(i.gender != "${result[0].gender}" AND i.sexuality != "homosexual") `;
      else if (result[0].sexuality == "homosexual")
        sql_main_query += `(i.gender = "${result[0].gender}" AND i.sexuality != "heterosexual") `;
      else
        sql_main_query += `((i.gender = "${result[0].gender}" AND i.sexuality != "heterosexual") OR (i.gender != "${result[0].gender}" AND i.sexuality != "homosexual")) `;

      sql_main_query += `AND i.age >= ${request.ageMin} AND i.age <= ${request.ageMax} AND i.popularity >= ${request.popularityMin} and i.popularity <= ${request.popularityMax};`;
      connection.query(sql_main_query, (err, result) => {
        if (err) throw err;

        const tag_sql = "SELECT tag from interests " +
          `WHERE user_id = ${user.id}`;
        connection.query(tag_sql, (err, tag_res) => {
          if (err) throw err;

          let sql_pos = "SELECT latitude, longitude FROM infos " +
            `WHERE user_id = ${user.id}`;
          connection.query(sql_pos, (err, pos_res) => {
            if (err) throw err;

            //Filter by distance
            result = result.filter((user) => {
              const score = u_search.syncDistanceScore(user.id, user, tag_res, pos_res);
              return (score / 1000 >= request.distanceMin && score / 1000 <= request.distanceMax);
            });

            u_search.filters_past(user.id, result)
              .then((result) => {
                  u_search.filters_interests(request.interests, result)
                    .then((result) => {
                      if (result.length === 0)
                        return res.json({});
                      for (let i = 0; i < result.length; i++) {
                        switch (request.sort) {
                          case "relevance":
                            sort_function = u_search.getRelevanceScore;
                            break;
                          case "age":
                            sort_function = u_search.getAgeScore;
                            break;
                          case "distance":
                            sort_function = u_search.getDistanceScore;
                            break;
                          case "popularity":
                            sort_function = u_search.getPopularityScore;
                            break;
                          case "interests":
                            sort_function = u_search.getInterestsScore;
                            break;
                        }
                        let matchScore;
                        if (result[i])
                          matchScore = sort_function(user.id, result[i], tag_res, pos_res)
                            .then((score) => {
                                result[i] = {
                                  ...result[i],
                                  matchScore: score
                                };
                                if (i === result.length - 1) {
                                  result.sort((first, second) => {
                                    if (request.order == "desc")
                                      return (second.matchScore.score - first.matchScore.score);
                                    else
                                      return (first.matchScore.score - second.matchScore.score)
                                  });
                                  return res.json(result.map((item) => {
                                    return ({
                                      id: item.id,
                                      matchScore: item.matchScore.score,
                                      dist: item.matchScore.dist
                                    })
                                  }));
                                }
                              }
                            );
                      }
                    })
                }
              );

          });
        });
      })
    })
  });

});

module.exports = router;