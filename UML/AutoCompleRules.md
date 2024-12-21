# AutoComplete Rules

Note:  All Keywords to be provided with the users prefernece on keyword casing:  UPPERCASE, lowercase,  PascalCase (Pascal_Case) .  (internally all keywords are stored in PascalCase (Pascal_Case) format)

## When in the Global Area 
(not inside a function, or an event driver) and:
* The cursor is at the beginning of a line
    * All Declarations
    * InputType Keyword
        * Digital_Input
        * Analog_Input
        * String_Input
        * Buffer_Input
    * OutputType Keyword
        * Digital_Output
        * Analog_Output
        * String_Output
        * Buffer_Output
    * ParameterType Keywords
        * Integer_Parameter
        * Signed_integer_Parameter
        * Long_integer_Parameter
        * Signed_long_integer_Parameter
        * String_Parameter
    * Variable Storage Modifiers (and then Variable Types after space)
        * Volatile
        * NonVolatile
        * Dynamic
        * Ascii
        * Utf16
        * Inherit
        * DelegateProperty
    * VariableType Keywords
        * Integer
        * Signed_integer
        * Long_integer
        * Signed_long_integer
        * String
    * Built-In structures
        * Tcp_Client
        * Tcp_Server
        * Udp_Socket
    * Structure Keyword
        * Structure
    * Function Storage Modifier (and then Function Keywords after space)
        * CallBack
    * FunctionType Keywords
        * Function
        * Integer_Function
        * Signed_integer_Function
        * Long_integer_Function
        * Signed_long_integer_Function
        * String_Function
    * Event Handler Keywords
        * EventHandler
        * GatherEventHandler
    * Event Storage Modifier (and then Event Keywords after space)
        * ThreadSafe
    * EventType Keywords
        * Push
        * Event
        * Change
        * Release
        * SocketConnect
        * SocketDisconnect
        * SocketReceive
        * SocketStatus
    * User Defined Classes From the SIMPL# APIs
* After user press space after the following Keyword Groups: 
    * Variable Storage Modifiers
        * VariableType Keywords
    * Function Storage Modifier
        * FunctionType Keywords
    * Event Storage Modifier
        * EventType Keywords
* All Other Keywords, don't provide any auto-complete suggestions

* When Inside a Parenthesized-Parameter-List
    * After a Parenthesis or a Comma
        * Parameter Keyword modifier (and then Parameter Keywords after space)
            * ByVal
            * ByRef
            * ReadOnlyRef
        * Keyword Type
            * Integer
            * Signed_integer
            * Long_integer
            * Signed_long_integer
            * String
            * EventArgs



## When inside a Structure Block
* The cursor is at the beginning of a line
    * Variable Storage Modifiers (and then Variable Types after space)
        * Volatile
        * NonVolatile
        * Dynamic
        * Ascii
        * Utf16
        * Inherit
        * DelegateProperty
    * Variable Types
        * Integer
        * Signed_integer
        * Long_integer
        * Signed_long_integer
        * String
    * Built-In Void Functions
    * Custom Void Function Names
    * Custom Class Names
        * Then after pressing dot, provide void Functions and Variables and recurse down the class for each dot
    * Custom Structure Names
        * Then after pressing dot, provide structure members and recurse down the structure for each dot
    * Provide Looping Construct keywords
        * For
        * While
        * Do
    * Provide local function declaration keyword
        * Wait
    * Provide Branching and decision keywords
        * If
        * Else
        * switch and then add case and default while inside switch
        * cswitch and then add case and default while inside switch
    * provide flow control keywords
        * Break
        * Continue
        * Return

* The cursor is at the right side after an assignment operand
    * Built-In non-void Functions
    * Custom Non-Void Function Names
    * Custom Class Names
        * Then after pressing dot, provide Non Void Functions and Variables and recurse down the class for each dot
    * Custom Structure Names
        * Then after pressing dot, provide structure members and recurse down the structure for each dot