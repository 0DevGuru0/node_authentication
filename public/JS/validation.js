var formates = [".jpg", ".jpeg", ".bmp", ".gif", ".png",".jpe",".ico",".svg",".svgz",".xcf",".drw",".pct"];    
function ValidateSingleInput(oInput) {
  if (oInput.type == "file") {
      var sFileName = oInput.value;
       if (sFileName.length > 0) {
          var blnValid = false;
          for (var j = 0; j < formates.length; j++) {
              var formate = formates[j];
              if (sFileName.substr(sFileName.length - formate.length, formate.length).toLowerCase() == formate.toLowerCase()) {
                  blnValid = true;
                  break;
              }
          } 
          if (!blnValid) {
              alert("Sorry, " + sFileName + " is invalid, allowed foramtes are: " + formates.join(", "));
              oInput.value = "";
              return false;
          }
      }
  }
  return true;
}