window.onload = function () {
// Initialize Firebase
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

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            fbuser = user;
            console.log(user);
        }
        else {
            fbuser = null;
        }
    });

    firebase.auth().signInAnonymously().catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);

        // ...
    });

    function send_message() {
        if (currentSchool) {
            var msgText = textInput.value;
            if (msgText.trim().length <= 0) {
                return
            }
            msgText = msgText.trim();
            console.log(msgText);
            getLocation();
            console.log(userLoc);
            firebase.database().ref('/' + currentSchool.path + '/messages/').push({
                uid: fbuser.uid,
                text: msgText,
                time: Date.now(),
                lat: userLoc.coords.latitude,
                lon: userLoc.coords.longitude
            });
            textInput.value = "";
            textInput.focus();
        }
    }

    var textInput = document.querySelector('#message_input');
    var postButton = document.querySelector('#send_message');

    postButton.addEventListener("click", function() {
        send_message();
    });

    $("#message_input").on('keyup', function (e) {
        if (e.keyCode == 13) {
            send_message();
        }
    });

    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                var side;
                // if (_this.messag)
                $message.addClass(_this.message_side).css('display', 'block').find('.text').html(_this.text);

                // $message.id('id', _this.message_id);
                // console.log(typeof $message);
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };

    firebase.database().ref('/schools/').once('value').then(function (snapshot) {
        if (snapshot.val()) {
            var count = 0;
            snapshot.forEach(function (childSnapshot) {
                var schoolItem = childSnapshot.val();
                schoolItem.key = childSnapshot.key;

                var $school = $($('.school_template').clone().html());
                $school.css('display', 'block').html(schoolItem.name);
                $school.attr('id', count);
                $school.attr('data-toggle', 'drawer');
                $school.on('click', function () {
                   console.log($(this).attr('id'));
                   changeSchool(schools[$(this).attr('id')]);
                });
                count = count + 1;
                $('.drawer-nav').append($school);

                if (userLoc != null) {
                    console.log("User loc is not null");
                    console.log(userLoc);
                    console.log(schoolItem);
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
            schools.sort(function (obj1, obj2) {
                return obj1.distance - obj2.distance;
            });
            console.log('/' + schools[0].path + '/messages/');
            changeSchool(schools[0]);
            currentSchool = schools[0];
            console.log(schools);
        }
        console.log(schools);
    });

    function changeSchool(school) {
        getLocation();
        console.log('changing school to' + school.name);
        if (currentSchool == null || (school.path != currentSchool.path)) {
            var ul = document.getElementById('message_window');
            if (ul) {
                while (ul.firstChild) {
                    ul.removeChild(ul.firstChild);
                }
            }
            messageIDs = [];
            db_ref = firebase.database().ref('/' + school.path + '/messages/');
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
        }
    }

    function getLocation() {
        console.log('Geo Called');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                    console.log(position.coords.latitude);
                    console.log(position.coords.longitude);
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
        var a = 0.5 - c((lat2 - lat1) * p)/2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p))/2;

        console.log("DISTANCE: " + 12742 * Math.asin(Math.sqrt(a)));
        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
};