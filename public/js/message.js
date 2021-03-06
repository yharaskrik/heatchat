window.onload = function () {
// Initialize Firebase
    $('.modal').modal({
            dismissible: true, // Modal can be dismissed by clicking outside of the modal
            opacity: .5, // Opacity of modal background
            inDuration: 300, // Transition in duration
            outDuration: 200, // Transition out duration
            startingTop: '4%', // Starting top style attribute
            endingTop: '10%', // Ending top style attribute
        }
    );

    var config = {
        apiKey: "AIzaSyCEEGAf_8ONezDvKqI5gLa4r57XLoH-qNE",
        authDomain: "heatchat-184021.firebaseapp.com",
        databaseURL: "https://heatchat-184021.firebaseio.com",
        projectId: "heatchat-184021",
        storageBucket: "heatchat-184021.appspot.com",
        messagingSenderId: "1048720965159"
    };
    firebase.initializeApp(config);

    var fbuser;
    var messageIDs = [];
    var userLoc;
    var schools = [];
    var currentSchool;
    var db_ref;
    var currentIndex;
    var loadedSchools = false;

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            fbuser = user;
            schoolListener();
        }
        else {
            fbuser = null;
        }
    });

    firebase.auth().signInAnonymously().catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;

        // ...
    });

    function send_message() {
        if (currentSchool) {
            var msgText = textInput.value;
            if (msgText.trim().length <= 0) {
                return
            }
            msgText = msgText.trim();
            getLocation();
            firebase.database().ref('/schoolMessages/' + currentSchool.path + '/messages/').push({
                uid: fbuser.uid,
                text: msgText,
                time: parseInt(Date.now()),
                lat: userLoc.coords.latitude,
                lon: userLoc.coords.longitude
            });
            textInput.value = "";
            textInput.focus();
        }
    }

    var textInput = document.querySelector('#message_input');
    var postButton = document.querySelector('#send_message');

    postButton.addEventListener("click", function () {
        send_message();
    });

    $("#message_input").on('keyup', function (e) {
        if (e.keyCode == 13) {
            send_message();
        }
    });

    textInput.addEventListener('focusin', function() {
        console.log('focusin');
        setTimeout(function(){
            console.log($(window).height());}, 1);
    });

    textInput.addEventListener('focusout', function () {
        console.log('focusout');
        console.log($(window).height());
    });

    textInput.addEventListener('focus', function () {
        console.log('focus');
        console.log($(window).height());
    });

    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());

                $message.addClass(_this.message_side).css('display', 'block').find('.text').html(_this.text);
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };

    function schoolListener() {
        firebase.database().ref('/schools/').once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    snapshot.forEach(function (childSnapshot) {
                        var schoolItem = childSnapshot.val();
                        schoolItem.key = childSnapshot.key;

                        var $school = $($('.school_template').clone().html());
                        $school.css('display', 'block').html(schoolItem.name);
                        $school.on('click', function () {
                            changeSchool(schools[$(this).attr('id')]);
                            console.log("Switching to: " + $(this).attr('id'));
                        });
                        schoolItem.html = $school;
                        // $('.list-group').append($school);

                        if (userLoc != null) {
                            schoolItem.distance = distance(
                                schoolItem.lat,
                                schoolItem.lon,
                                userLoc.coords.latitude,
                                userLoc.coords.longitude);
                        }
                        else {
                            schoolItem.distance = 0;
                        }
                        schools.push(schoolItem);
                    });
                    console.log(schools);
                    schools.sort(function (obj1, obj2) {
                        return obj1.distance - obj2.distance;
                    });
                    var count = 0;
                    schools.forEach(function (t) {
                        $('.list-group').append(t.html.attr('id', count));
                        count = count + 1;
                    });
                    changeSchool(schools[0]);
                    currentSchool = schools[0];
                    disableInput();
                }
            });
    }


    function changeSchool(school) {
        getLocation();
        if (currentSchool == null || (school.path != currentSchool.path)) {
            currentSchool = school;
            console.log(school.name + ' Heatchat');
            $("#title").html(school.name + ' Heatchat');
            var ul = document.getElementById('message_window');
            if (ul) {
                while (ul.firstChild) {
                    ul.removeChild(ul.firstChild);
                }
            }
            messageIDs = [];
            db_ref = firebase.database().ref('schoolMessages/' + school.path + '/messages/');
            db_ref.on('value', function (snapshot) {
                if (snapshot.val()) {
                    snapshot.forEach(function (childSnapshot) {

                        var currentMsg = childSnapshot.val();
                        if (messageIDs.indexOf(childSnapshot.key) === -1) {
                            messageIDs.push(childSnapshot.key);

                            if (currentMsg.uid === fbuser.uid) {
                                currentMsg.side = 'right';
                            }
                            else {
                                currentMsg.side = 'left';
                            }
                            var message = new Message({
                                text: currentMsg.text,
                                message_side: currentMsg.side,
                                message_id: childSnapshot.key
                            });
                            message.draw();
                            $('ul li.message').last()[0].scrollIntoView()
                        }
                    });
                }
            });
            disableInput();
        }
    }

    function disableInput() {
        if (currentSchool != null) {
            if (currentSchool.distance > 30) {
                textInput.disabled = true;
                postButton.disabled = true;
                textInput.placeholder = "Not close enough to this school.";
            }
            else {
                textInput.disabled = false;
                postButton.disabled = false;
                textInput.placeholder = "Enter a message.";
            }
        }
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                    userLoc = position;
                }
            );
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    }

    getLocation();



    function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    $(".button-collapse").sideNav({
        edge: 'left', // Choose the horizontal origin
        closeOnClick: true,
        draggable: true
    });

    $(document).ready(function () {
        console.log($(window).height());
        $('#modal1').modal('open');
        $('.message_window').height($(window).height() - $('.footer').height() - $('.nav-wrapper').height());
        textInput.focus();
        postButton.focus()
    });

    $(window).on('resize', function () {
        $('.message_window').height($(window).height() - $('.footer').height() - $('.nav-wrapper').height());
    });
};