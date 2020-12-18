// $(document).ready(function () {
//     getAcidificacao();
// })


function getAcidificacao(){
    $.ajax({
        url: "http://localhost:3000/api/v1/acidification",
        type: "GET",
        success: function (result) {
            console.log(result);
            insertRows(result);
        },
        error: function (error) {
            console.log(error);
        }
    })
}


function insertRows(results){
    var table = document.getElementById("acidification-table");
    $("#acidification-table").empty();
    row = table.insertRow();
    cell1 = row.insertCell(0);
    cell2 = row.insertCell(1);
    cell3 = row.insertCell(2);
    cell1.innerHTML = "Timestamp";
    cell2.innerHTML = "Local";
    cell3.innerHTML = "PH";
    var row, cell1, cell2, cell3;
    for (let i = 0; i < results.length; i++) {
        row = table.insertRow();
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);
        cell1.innerHTML = results[i].timestamp;
        cell2.innerHTML = results[i].local;
        cell3.innerHTML = results[i].ph;
    }
}

