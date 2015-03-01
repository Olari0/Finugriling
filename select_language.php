<?php
/**
 * @author Tormi Talv <tormit@gmail.com> 2014
 * @since 2015-03-02 01:05
 * @version 1.0
 */

// Incorporate some include files:
include 'initialize/db.inc.php'; // 'db.inc.php' is included to hide username and password
include 'includes/header.inc.php'; // include header
include 'includes/footer.inc.php'; // include footer
include 'includes/include.inc.php'; // include common functions
include 'initialize/ini.inc.php'; // include common variables

// --------------------------------------------------------------------

// START A SESSION:
// call the 'start_session()' function (from 'include.inc.php') which will also read out available session variables:
start_session(true);

// --------------------------------------------------------------------

// Initialize preferred display language:
// (note that 'locales.inc.php' has to be included *after* the call to the 'start_session()' function)
include 'includes/locales.inc.php'; // include the locales


// (1) OPEN CONNECTION, (2) SELECT DATABASE
connectToMySQLDatabase(); // function 'connectToMySQLDatabase()' is defined in 'include.inc.php'

$sql = "SELECT language_name FROM languages WHERE language_id = %d";

$query = mysql_query(sprintf($sql, intval($_POST['language_id'])));
$data = mysql_fetch_array($query, MYSQL_ASSOC);


if (isset($data['language_name'])) {
    saveSessionVariable("userLanguage", $data['language_name']);
} else {
    unset($_SESSION['userLanguage']);
}

header('Location: index.php');