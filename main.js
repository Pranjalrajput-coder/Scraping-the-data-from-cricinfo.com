        // Scraping the Data from the Cricinfo website and write it down on an excel sheet and create a pdf file

let minimist = require("minimist");
let axios = require("axios");
let path = require("path");
let pdf = require("pdf-lib");
let excel = require("excel4node");
let jsdom = require("jsdom");
let fs = require("fs");
let rgb = pdf.rgb;

//  These are the required Library to Run This Program 

let args = minimist(process.argv);

let url = axios.get(args.url); // to get in the text format of URL content
url.then(function (response) {
    let html = response.data;

    let dom = new jsdom.JSDOM(html); // dom is like tree type structure which helps to fetching out the particular content
    let document = dom.window.document;

    let matchesArray = []; // Make a new array where overall data store

    let matchdivs = document.querySelectorAll("div.match-score-block"); // select all div which have match-score

    for (let i = 0; i < matchdivs.length; i++) { //for making team.josn file and store the data this below format
        let matchdiv = matchdivs[i];
        let match = {
            team1: "",
            team2: "",
            team1Score: "",
            team2Score: "",
            result: ""
        };
        // Teams Name
        let teamParas = matchdiv.querySelectorAll("div.name-detail > p.name"); // for fetching out the teams name
        match.team1 = teamParas[0].textContent; // for fetching out the first team name
        match.team2 = teamParas[1].textContent; // for fetching out the second team name

        // Every Team Score
        let scores = matchdiv.querySelectorAll("div.score-detail > span.score"); // for fetching out the teams score
        if (scores.length == 2) { //if both teams have score, means both are played

            match.team1Score = scores[0].textContent; // for fetching out the first team score
            match.team2Score = scores[1].textContent; // for fetching out the second team score

        } else if (scores.length == 1) { // if only team played, then put there score

            match.team1Score = scores[0].textContent;

        } else { // if both team didn't played, don't fill the blocks

            match.team1Score = "";
            match.team2Score = "";

        }

        // Teams Result
        let resultSpan = matchdiv.querySelector("div.status-text > span"); //fetching out the results of both team
        match.result = resultSpan.textContent; // put the result in text format in match.result
        matchesArray.push(match); // then push it into the match array


    }
    // console.log(matchesArray);   only print the data in console

    let MatchJSONFile = JSON.stringify(matchesArray); // for manipulate the data in matchesArray, we use stringify property
    fs.writeFileSync("matches.json", MatchJSONFile, "utf-8"); // this line make matches.json file in the folder (FILENAME , manipulated file,Format)



    let teams = []; // Now make an another array, to put the details in cohrent format 

    // Put all the teams name and their matches
    for (let i = 0; i < matchesArray.length; i++) {
        putTheMissingTeamIn_teams(teams, matchesArray[i].team1);
        putTheMissingTeamIn_teams(teams, matchesArray[i].team2);


    }
    // Here we insert the data of opponent, team_1_score, team_2_score, & result in Match Block 
    for (let i = 0; i < matchesArray.length; i++) {
        puttingTeamAtRightPostition(teams, matchesArray[i].team1, matchesArray[i].team2, matchesArray[i].team1Score, matchesArray[i].team2Score, matchesArray[i].result);
        puttingTeamAtRightPostition(teams, matchesArray[i].team2, matchesArray[i].team1, matchesArray[i].team2Score, matchesArray[i].team1Score, matchesArray[i].result);


    }

    let TeamsJSON = JSON.stringify(teams); // for write the data which is in the teams Arrays
    fs.writeFileSync("teams.json", TeamsJSON, "utf-8"); // this line make a teams.json file in the folder (FILENAME ,manipulated json, Format)

    prepare_excel_file(teams, args.excel); // It makes an excel sheet, where we fill all the data of individual teams,
    //  like team name, and their matches and score and result        

    create_folder_and_pdf(teams); // It makes a folder of every individual team and their data



}).catch(function (err) { // for declaring the error if it's come 
    console.log(err); //     print the error in the console
});

function putTheMissingTeamIn_teams(teams, teamName) {
    let tidx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].team == teamName) { // It make sure that is team 1 name is there or not  
            // if team == teamName , then tidx = i, then break
            tidx = i;
            break;
        }
    }
    if (tidx == -1) { //if tidx = -1 then push the objective mentioned below in team 
        teams.push({
            team: teamName, // insert the team name in team objective
            match: [] // only create match objective to insert further details
        })
    }
}

// In this function all the data will insert in the match objective that we had made before

function puttingTeamAtRightPostition(teams, homeTeam, oppTeam, selfScore, oppScore, result) {
    let tidx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].team == homeTeam) {
            tidx = i;
            break;
        }

    }

    let team = teams[tidx];
    team.match.push({
        vs: oppTeam, // opponent team name will be write here
        selfScore: selfScore, // self score will be write here
        oppScore: oppScore, //  opponent score will be write here
        result: result // overall result will be write here
    })


}

// This function will Prepare an Excel File

function prepare_excel_file(teams, file_name) {
    let wb = new excel.Workbook(); // adding a workbook

    for (let i = 0; i < teams.length; i++) {
        let wrksheet = wb.addWorksheet(teams[i].team); // shhet will be added in excel sheet according to the total teams 

        let style = wb.createStyle({
            font: {
              color: '#FF0800',
              size: 12,
            }
          });

        wrksheet.cell(1, 1).string("VS").style(style);
        wrksheet.cell(1, 2).string("Self Score").style(style);
        wrksheet.cell(1, 3).string("Opponent Score").style(style);
        wrksheet.cell(1, 4).string("Result").style(style);
        for (let j = 0; j < teams[i].match.length; j++) {
            for (let j = 0; j < teams[i].match.length; j++) {
                wrksheet.cell(2 + j, 1).string(teams[i].match[j].vs);
                wrksheet.cell(2 + j, 2).string(teams[i].match[j].selfScore);
                wrksheet.cell(2 + j, 3).string(teams[i].match[j].oppScore);
                wrksheet.cell(2 + j, 4).string(teams[i].match[j].result);
            }

        }
    }
    wb.write(file_name); // csv file will generate
}

// This function will create a folder with pdf's
function create_folder_and_pdf(teams) {

    fs.mkdirSync(args.dataFolder); // This line will create a folder of Every Individual Team name

    for (let i = 0; i < teams.length; i++) {
        let teams_folder_path = path.join(args.dataFolder, teams[i].team); // Create directory path of every individual team 
        fs.mkdirSync(teams_folder_path); // Insert the folder in datafolder

        for (let j = 0; j < teams[i].match.length; j++) { // this loop helps to make pdf inside every team folder
            let matchFileName = path.join(teams_folder_path, teams[i].match[j].vs + ".pdf");
            create_a_score_card(teams[i].team, teams[i].match[j], matchFileName); // here pdf function will call
        }
    }
}

// This function will create pdf inside the Every Team Folder
function create_a_score_card(teamName, match, matchFileName) {
  
    let t1 = teamName;                       //  Intialize teamName in t1 variable
    let t2 = match.vs;                       // Intialize opponent name in t2 variable
    let t1s = match.selfScore;               //Intialize self score in t1s variable
    let t2s = match.oppScore;                //Intialize opponent score in t2s variable
    let final_result = match.result;         //Intialize overall result in final_result variable

    let bytes_Of_PDF_Template = fs.readFileSync("Template.pdf"); // this line will read Template.pdf file
    let pdf_Doc_Ka_Promise = pdf.PDFDocument.load(bytes_Of_PDF_Template); // this line will load the Template.pdf file inside the cricinfo folder

    pdf_Doc_Ka_Promise.then(function (pdfdoc) {
        let page = pdfdoc.getPage(0); // this line will give starting page of the Template.pdf 
        page.drawText(t1, { //  Modify the x & y axis of t1 data inside the pdf
            x: 525,
            y: 375,
            size: 23,
             // color: rgb(0,0,0), 
        });
        
        page.drawText(t2, { //  Modify the x & y axis of t2 data inside the pdf 
            x: 550,
            y: 317,
            size: 18,
            // color: rgb(0,0,0),
        });
        page.drawText(t1s, { // Modify the x & y axis of t1s data inside the pdf
            x: 550,
            y: 258,
            size: 18,
            // color: rgb(0,0,0),
        });
        page.drawText(t2s, { // Modify the x & y axis of t2s data inside the pdf
            x: 550,
            y: 200,
            size: 18,
            // color: rgb(0,0,0),
        });
        page.drawText(final_result, { //    Modify the x & y axis of result data inside the pdf  
            x: 380,
            y: 30,
            size: 20,
            // color: rgb(0,0,0),
        });


        let pdf_save = pdfdoc.save(); // This line will only give the promise to save the data inside the pdf
        pdf_save.then(function (finalPDFByte) { // this line will complete the promise
            fs.writeFileSync(matchFileName, finalPDFByte); // this line will write the data inside the pdf 
        })
    }).catch(function(err){
        console.log(err);
    })
}
//  Firing Command for run the code in the terminal
// node main.js --excel=Worldcup.csv --dataFolder=data --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"