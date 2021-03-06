 //
// DupCharToken
//
// This script will duplicate a character sheet and tokens giving the new characters and tokens an identifying number and
// linking each new token to it's own individual new character sheet.
// This script is useful for those who want to create multiple copies of monsters because they prefer multiple character sheets to linking tokens as Mooks. 
// Using an argument of "clean" causes it to clean up (delete) numbered tokens and characters such as this script creates. 
//
// Examples: 
//	If you select a token named "Skel" that is linked to a character named "Skeleton", and in the chat window enter
//		!DupCharToken 5
//	It will make 5 new characters, identical to the original, named "Skeleton 1" through "Skeleton 5", 
//	and make 5 new tokens, identical to the original and stacked in the exact same location, named "Skel 1" through "Skel 5". 
//	Each token will be linked to its corresponding character sheet in the exact same manor as the originals were linked.
//
//  If later on you select any token named "Skel" or "Skel (number)" and enter
//		!DupCharToken clean
//	It will delete all tokens where the name is "Skel (any number)" and all characters named "Skeleton (any number)". 
//	The original token and character (without a number) will not be deleted. 
//
//
// Known bugs/issues:  If the avatar image of the character is not in a user library (i.e: it's a marketplace image or from the Monster Manual, or the like), 
// due to limits placed upon the API, it can't set an avatar image. You will have to do that yourself. 
//
//
// This script is based upon a script by "The Aaron".
//		https://app.roll20.net/forum/post/5687127/duplicate-character-sheet-plus-linked-token-script/?pageforid=5687127#post-5687127
// It has been modified to it's current form by Chris Dickey (Roll20 user "Chris D").
// Last updated: 2018 Dec
// Version 01.00 Chris D. 
//
// Commands:
//      !DupCharToken (Number of tokens to create) (Starting number)
// 		!DupCharToken clean
//	Number to create is the number of characters and tokens to copy/create. It defaults to 1.
//	Starting number is the number to start numbering the tokens and characters from. Defaults to 1. 
//	So !dupCharacter 5 3  	would start numbering at 3 ending at number 7. 
//
// You can add the following text to a macro
// !dupCharToken ?{How many Duplicates|1} ?{Starting Number|1}


on('ready',()=>{
    'use strict';

    on('chat:message',(msg)=>{
		'use strict';

		if( 'api' === msg.type && playerIsGM( msg.playerid ) && /^!dupCharToken\b/i.test( msg.content )) {

			function sChat( txt ) {
				sendChat('DupCharToken', '/w ' + msg.who.replace(" (GM)","") + ' <div style="color: #993333;font-weight:bold;">' + txt + '</div>', null, {noarchive:true});
			}

			if( /\bclean\b/i.test( msg.content ) || /\bdelete\b/i.test( msg.content )) {		// We are not duplicating, we are cleaning up characters and tokens that we created previously.
				let tnames = [],
					cnames = [];
				if( !msg.selected || msg.selected.length == 0 )
					sChat( "Please select exactly one token representing the character to duplicate.  Script usage is !DupCharToken (Number of tokens to create) (Starting number)   or !DupCharToken clean");
				else {
					_.each( msg.selected, function( sel ) {		// for each message, find base token name and base character name. add unique ones to list.
						let tokenObj = getObj('graphic', sel._id);
						if ( _.isUndefined( tokenObj ) )
							sChat( "Token is invalid in some way." );
						else {
							let tn = tokenObj.get( "name" ).replace( /\s+\d+\s*$/, "");		// one or more whitespaces, one or more digits, zero or more whitespaces, then the end of line get trimmed off. 
							if( tnames.indexOf( tn ) == -1 )
								tnames.push( tn );
							let charObj = getObj('character', tokenObj.get('represents'));
							if ( _.isUndefined( charObj ) )
								sChat( "Token is not correctly linked to a good character." );
							else {
								let cn = charObj.get( "name" ).replace( /\s+\d+\s*$/, "");		// one or more whitespaces, one or more digits, zero or more whitespaces, then the end of line get trimmed off. 
								if( cnames.indexOf( cn ) == -1 )
									cnames.push( cn );
							}
						}
					});	// end each selected token
				}

				function getRegEx( arr ) {
					let re = "^(";
					arr.forEach( function(nm ) { re += nm + "|"; });
					return new RegExp ( re.slice( 0, -1) + ")\\s\\d+\\s*$" );		// trim off last pipe. 
				};
							// search for token names.  for each found token, delete.
				let reg = getRegEx( tnames ),
					d = [];
				_.each(findObjs({type:"graphic", _subtype: "token" }),( tObj )=>{
					if( reg.test( tObj.get( 'name' ) ) ) {
						d.push( tObj.get( 'name' ) );
						tObj.remove();
					}
				});
				sChat( "Deleted tokens: " + d.join() + "." );
				
							// search for character names, for each, delete. 
				reg = getRegEx( cnames );
				d = [];
				_.each(findObjs({type:"character" }),( cObj )=>{
					if( reg.test( cObj.get( 'name' ) ) ) {
						d.push( cObj.get( 'name' ) );
						cObj.remove();
					}
				});
				sChat( "Deleted characters: " + d.join() + "." );
						// End clean
			} else if( !msg.selected || msg.selected.length !== 1 )
				sChat( "Please select exactly one token representing the character to duplicate.  Script usage is !DupCharToken (Number of tokens to create) (Starting number)   or !DupCharToken clean");
			else {				// Not cleaning up, presumably duplicating.
				let num = 1,
					startnum = 1;
				let cl = msg.content.split( /\s+/ );
				if( cl.length > 1 ) {
					if( parseInt( cl[ 1 ] ) )
						num = parseInt( cl[ 1 ] );
					else {
						sChat( "Script usage is !DupCharToken (Number of tokens to create) (Starting number)   or !DupCharToken clean");
						return;
					}
					if( cl.length > 2 && parseInt( cl[ 2 ] ) )
						startnum = parseInt( cl[ 2 ] );
				}

				let tokenObj = getObj('graphic', msg.selected[ 0 ]._id);
				if ( _.isUndefined( tokenObj ) )
					sChat( "Token is invalid in some way." );
				else {		// Good command line.
					let charArray = [],
						links = [];

					function getLink( n, lnk ) {
						let l = tokenObj.get( lnk );
						if( l && l != "" ) {
							let a = getObj("attribute", l);
							if( a && a.get( "name" ) != "" )
								links [ n ] = a.get( "name" );
						}
					}
					getLink( 0, "bar1_link" );
					getLink( 1, "bar2_link" );
					getLink( 2, "bar3_link" );

					let charObj = getObj('character', tokenObj.get('represents'));
					if ( _.isUndefined( charObj ) )
						sChat( "Token is not correctly linked to a good character." );
					else		// Everything is good. We are duplicating. 
						for( let i = startnum; i < (startnum + num); ++i) {			// We are going to want to duplicate both the character and token this many times.
							let oldCid = charObj.id;
							let newC = JSON.parse(JSON.stringify( charObj ));			// Simple true copy of object. 
							delete newC._id;
							newC.name= charObj.get( 'name' ) + " " + i;
							
							let parts = newC.avatar.match(/(.*\/images\/.*)(thumb|med|original|max)([^?]*)(\?[^?]+)?$/);
							if(parts)
								newC.avatar = parts[1]+'thumb'+parts[3]+(parts[4]?parts[4]:`?${Math.round(Math.random()*9999999)}`);
							else
								newC.avatar = "";

							let newT = JSON.parse(JSON.stringify( tokenObj ));
							delete newT._id;
							newT.name = tokenObj.get( 'name' ) + " " + i;
							parts = newT.imgsrc.match(/(.*\/images\/.*)(thumb|med|original|max)([^?]*)(\?[^?]+)?$/);
							if(parts)
								newT.imgsrc = parts[1]+'thumb'+parts[3]+(parts[4]?parts[4]:`?${Math.round(Math.random()*9999999)}`);
							else
								newT.imgsrc = "";

							let newCObj = createObj('character', newC);
							let newTObj = createObj('graphic', newT);
							charArray.push( newCObj );
							newTObj.set('represents', newCObj.id);

							_.each(findObjs({type:'attribute', characterid:oldCid}),(a)=>{			// Copy each attribute
								let sa = JSON.parse(JSON.stringify(a));
								delete sa._id;
								delete sa._type;
								delete sa._characterid;
								sa._characterid = newCObj.id;
								let newA = createObj('attribute', sa);
								if( links.indexOf( sa.name ) > -1 ) 
									newTObj.set( "bar" + (links.indexOf( sa.name ) + 1).toString() + "_link", newA.id);		// Link the new token to the new attribute.
							});
							_.each(findObjs({type:'ability', characterid:oldCid}),(a)=>{			// Copy each ability
								let sa = JSON.parse(JSON.stringify(a));
								delete sa._id;
								delete sa._type;
								delete sa._characterid;
								sa._characterid = newCObj.id;
								createObj('ability', sa);
							});

							setDefaultTokenForCharacter( newCObj, newTObj);
							toFront( newTObj );
						}		// End For each character to create.

						charObj.get("bio", function(bio) {
							charObj.get("gmnotes", function(gmnotes) {
								_.each( charArray, c => { 
									if( !_.isNull( bio ) && !_.isUndefined( bio) && bio != "null" && bio != "undefined" && !(typeof bio === 'string' && bio.trim() == "") )
										c.set( 'bio', bio ); 
									if( !_.isNull( gmnotes ) && !_.isUndefined( gmnotes) && gmnotes != "null" && gmnotes != "undefined" && !(typeof gmnotes === 'string' && gmnotes.trim() == "") )
										c.set( 'gmnotes', gmnotes ); 
								});
							});
						});
						sChat( "Duplicated: " + charObj.get( "name" ) + " " + num + " times." );
				}		// End tokenObj is OK.
            }		// End have one token selected. 
        }		// End msg if for this script. 
    }); 	// End on Chat. 
});		// End on Ready.
 