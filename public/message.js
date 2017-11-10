window.onload = function() {
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

    function send_message () {
        var msgText = textInput.value;
        if (msgText.trim().length <= 0) {
            return
        }
        console.log(msgText);
        getLocation();
        console.log(userLoc);
        firebase.database().ref('messages/').push({
            uid: fbuser.uid,
            text: msgText,
            time: Date.now(),
            lat: userLoc.coords.latitude,
            lon: userLoc.coords.longitude
        });
        textInput.value = "";
        textInput.focus();
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
                console.log(typeof $message);
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
            snapshot.forEach(function (childSnapshot) {
                var currentSchool = childSnapshot.val();
                currentSchool.key = childSnapshot.key;

                schools.push(currentSchool);
            });
            console.log('Schools');
            console.log(schools);
            console.log(schools[0].path);
            var db_ref = firebase.database().ref('/' + schools[0].path + '/messages/');
            db_ref.on('value', function (snapshot) {
                console.log("listening");
                console.log(snapshot.val());
                if (snapshot.val()) {
                    console.log(snapshot.val());
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
        console.log(schools);
    });



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
};