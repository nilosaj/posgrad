var  sqlite3 = require('sqlite3').verbose();
var async = require('async');
var dbfutebol = new sqlite3.Database('database.sqlite');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;


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





exports.consultaPontuacaoFinal = function consultaPontuacaoFinal(temporada,idPais){
    dbfutebol.serialize(function(){
        dbfutebol.all(
    "  select  Tabela.home_team_api_id as teamId, Team.team_long_name as teamName, Tabela.score as score , Tabela.gols_pro as gols_pro , Tabela.gols_against as gols_against ,Tabela.Home_shootsIn as home_shoots,Tabela.Home_cross ,Tabela.Home_possession,Tabela.Home_corner ,Tabela.Away_shootsIn,Tabela.Away_cross , Tabela.Away_possession,Tabela.Away_corner   from   "+
    "  (select H.home_team_api_id , H.home+A.Away as score , H.gols_casa+A.gols_visitante as gols_pro, H.gols_visitante+A.gols_casa as gols_against  , H.shoton as Home_shootsIn,H.cross as Home_cross , H.possession as Home_possession,H.corner as Home_corner , A.shoton as Away_shootsIn,A.cross as Away_cross , A.possession as Away_possession,A.corner as Away_corner    from     "+
    "      (select home_team_api_id , shoton ,cross , possession,corner , sum(point_home) as home , sum(home_team_goal) as gols_casa , sum(away_team_goal) as gols_visitante from  "+
    "          (select  id , country_id , league_id , season , stage , date , match_api_id , home_team_api_id , away_team_api_id ,home_team_goal , away_team_goal, shoton ,cross , possession,corner ,    "+
    "           CASE WHEN home_team_goal > away_team_goal THEN 3      "+
    "                WHEN home_team_goal < away_team_goal THEN 0      "+
    "                WHEN home_team_goal == away_team_goal THEN 1     "+
    "                END AS 'point_home'  from    "+
    "                  Match where season = '"+temporada+"' and league_id = "+idPais+" ) group by home_team_api_id  ) H ,   "+
    "      (select away_team_api_id , shoton ,cross , possession,corner, sum(point_away) as away , sum(home_team_goal) as gols_casa , sum(away_team_goal) as gols_visitante from    "+
    "          (  select  id , country_id , league_id , season , stage , date , match_api_id , home_team_api_id , away_team_api_id ,home_team_goal , away_team_goal ,  shoton,cross , possession,corner ,    "+
    "           CASE WHEN home_team_goal < away_team_goal THEN 3     "+
    "                WHEN home_team_goal > away_team_goal THEN 0     "+
    "                WHEN home_team_goal == away_team_goal THEN 1    "+  
    "                END AS 'point_away'   from     "+
    "                   Match where season = '"+temporada+"' and league_id = "+idPais+"  ) group by away_team_api_id  ) A    "+
    "   on H.home_team_api_id = A.away_team_api_id  ) as Tabela , Team  on Tabela.home_team_api_id = Team.team_api_id   "+    
    "   order by Tabela.score desc     "




            ,function(error,rows){
                //console.log("["+row.teamId+"]   "+row.teamName+"    ("+row.tabela.score+")")
                //console.log("["+row.teamId+"]   " + row.teamName + "  ("+row.score+")" + " "+capturaChutes(row.home_shoots,row.teamId) )
                //console.log(row.length);
                var times = [];
                async.eachSeries(rows,function(teste,callback){
                    rows.forEach(function(row){
                        
                                 capturaInfoCasa(row.teamId,row.teamName,row.score,row.gols_pro,row.gols_against,idPais,temporada);
                                 capturaInfoFora(row.teamId,row.teamName,row.score,idPais,temporada);
                                
                               // console.log("["+row.teamId+"]   " + row.teamName + "  ("+row.score+")  ") 
                    });  
                });  





            } )


    });
    
}



 function capturaInfoCasa(teamId ,teamName, score ,golspro , golsagainst,idPais,season){
    var chutes =0;
    var cruzamentos =0;
    var escanteios =0;
    var posse = 0;
    var posicao = 0;
    
    dbfutebol.serialize(function(){
        dbfutebol.all("select shoton,cross , possession ,corner  from Match where league_id = "+idPais+"  and home_team_api_id ="+teamId+" and season = '"+season+"' ",function(err,rows){
           if(err){
               console.log(err)
           }

            async.eachSeries(rows,function(teste,callback){

                     rows.forEach(function(row){

                                var docshot = new dom().parseFromString(row.shoton);
                                var shot = xpath.select("count(/shoton/value[team ='"+teamId+"']/stats)", docshot);
                                chutes = chutes + shot;
                                
                                var doccross = new dom().parseFromString(row.cross);
                                var  cross =+ xpath.select("sum(/cross/value[team ='"+teamId+"']/stats/crosses)", doccross);
                                cruzamentos= cruzamentos +cross;
                                
                                var docposse = new dom().parseFromString(row.possession);
                                var possession =+ xpath.select("(/possession/value[elapsed='90']/homepos/text())", docposse);
                                
                                if (possession > 0) {
                                    posse = posse + possession
                                }else{        
                                    posse = posse + 50;
                                }
                                var doccorner = new dom().parseFromString(row.corner);
                                var corner =+ xpath.select("sum(/corner/value[team ='"+teamId+"']/stats/corners)", doccorner);
                                escanteios = escanteios + corner;
                            // console.log("["+teamId+"] chutes="+shot )//+"  cruzamentos="+cross+"  posse="+possession+" escanteio="+corner )
                                
                            //console.log("quantidade atual de -  chutes :"+chutes+"  cruzamentos:"+cruzamentos +" escanteios:"+escanteios+"  posse:"+(posse))

                           
                        });
                         var valores = idPais+";"+season+";"+teamId+";"+teamName+";"+score+";"+ Math.round(golspro)+";"+Math.round(golsagainst/19)+";"+Math.round(chutes/19)+";"+Math.round(cruzamentos/19)+";"+Math.round(escanteios/19)+";"+Math.round(posse/19);
                            console.log(valores) 

                               
            })
                       
        })    
    })
  
}

function capturaInfoFora(teamId ,teamName, score ,idPais,season){
    var chutes =0;
    var cruzamentos =0;
    var escanteios =0;
    var posse = 0;
    
    dbfutebol.serialize(function(){
        dbfutebol.all("select shoton,cross , possession ,corner  from Match where league_id = "+idPais+"  and away_team_api_id ="+teamId+" and season = '"+season+"' ",function(err,rows){
           if(err){
               console.log(err)
           }

          
            async.eachSeries(rows,function(teste,callback){
                    //console.log(rows.length)
                     rows.forEach(function(row){
                                
                                 //atributo teamId usado para definio home
                                var docshot = new dom().parseFromString(row.shoton);
                                var shot = xpath.select("count(/shoton/value[team ='"+teamId+"']/stats)", docshot);
                                chutes = chutes + shot;
                                //atributo teamId usado para definio home
                                var doccross = new dom().parseFromString(row.cross);
                                var  cross =+ xpath.select("sum(/cross/value[team ='"+teamId+"']/stats/crosses)", doccross);
                                cruzamentos= cruzamentos +cross;
                                
                                //identifica home atraves da tag homepos
                                var docposse = new dom().parseFromString(row.possession);
                                var possession =+ xpath.select("(/possession/value[elapsed='90']/awaypos/text())", docposse);
                                
                                if (possession > 0) {
                                    posse = posse + possession
                                }else{        
                                    posse = posse + 50;
                                }
                                var doccorner = new dom().parseFromString(row.corner);
                                var corner =+ xpath.select("sum(/corner/value[team ='"+teamId+"']/stats/corners)", doccorner);
                                escanteios = escanteios + corner;
                             //console.log("["+teamId+"] chutes="+shot )//+"  cruzamentos="+cross+"  posse="+possession+" escanteio="+corner )
                                
                            //console.log("quantidade atual de -  chutes :"+chutes+"  cruzamentos:"+cruzamentos +" escanteios:"+escanteios+"  posse:"+(posse))

                           
                        });
                         var valores = ";"+Math.round(chutes/19)+";"+Math.round(cruzamentos/19)+";"+Math.round(escanteios)/19+";"+Math.round(posse/19);
                            console.log(valores) 

                               
            })
                       
        })    
    })
  
}






