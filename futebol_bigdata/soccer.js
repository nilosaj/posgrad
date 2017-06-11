var  sqlite3 = require('sqlite3').verbose();

var dbfutebol = new sqlite3.Database('database.sqlite');



exports.TabelaJogos = function consultaTabelaJogos(temporada){
    dbfutebol.serialize(function(){

        dbfutebol.each(" select  id , country_id , league_id , season , stage , date , match_api_id , home_team_api_id as teste, away_team_api_id ,home_team_goal , away_team_goal , "+
 " CASE WHEN home_team_goal > away_team_goal THEN 3 "+
 " WHEN home_team_goal < away_team_goal THEN 0 "+
 " WHEN home_team_goal == away_team_goal THEN 1 " +
 " END AS 'point'  from Match where season = '"+temporada+"' ",function(error , row){
            console.log("PARTIDA :"+row.home_team_api_id+"("+row.home_team_goal+") X ("+row.away_team_goal+")"+row.away_team_api_id+" Pontos time da Casa :"+row.point);
        });

    });


    dbfutebol.close();
}





exports.pontuacaoFinal = function consultaPontuacaoFinal(temporada,idPais){
    dbfutebol.serialize(function(){
        dbfutebol.each(
    "    select  Tabela.home_team_api_id as teamId , Team.team_long_name as teamName, Tabela.score as score from   "+
    "     (select H.home_team_api_id , H.home+A.Away as score  from     "+
    "         (select home_team_api_id , sum(point_home) as home from   "+
    "             (  select  id , country_id , league_id , season , stage , date , match_api_id , home_team_api_id , away_team_api_id ,home_team_goal , away_team_goal ,    "+
    "              CASE WHEN home_team_goal > away_team_goal THEN 3      "+
    "                   WHEN home_team_goal < away_team_goal THEN 0      "+
    "                   WHEN home_team_goal == away_team_goal THEN 1     "+
    "                   END AS 'point_home'  from    "+
    "                     Match where season = '2008/2009' and league_id = 1729 ) group by home_team_api_id  ) H ,   "+
    "         (select away_team_api_id , sum(point_away) as away from    "+
    "             (  select  id , country_id , league_id , season , stage , date , match_api_id , home_team_api_id , away_team_api_id ,home_team_goal , away_team_goal ,  "+
    "              CASE WHEN home_team_goal < away_team_goal THEN 3     "+
    "                   WHEN home_team_goal > away_team_goal THEN 0   "+
    "                   WHEN home_team_goal == away_team_goal THEN 1      "+
    "                   END AS 'point_away'   from     "+
    "                      Match where season = '2008/2009' and league_id = 1729  ) group by away_team_api_id  ) A    "+
    "      on H.home_team_api_id = A.away_team_api_id  ) as Tabela , Team  on Tabela.home_team_api_id = Team.team_api_id    "+
    "      order by Tabela.score desc        "




            ,function(error,row){
                //console.log("["+row.teamId+"]   "+row.teamName+"    ("+row.tabela.score+")")
                console.log("["+row.teamId+"]   " + row.teamName + "  ("+row.score+")" )
            } )


    });
     dbfutebol.close();
}







