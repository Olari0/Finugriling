<?php

/**
 * @author Tormi Talv <tormit@gmail.com> 2014
 * @since 2014-11-07 01:11
 * @version 1.0
 */
class IncludeTest extends PHPUnit_Framework_TestCase
{

    public function testClean()
    {
        $text = 'command<';
        $clean = clean($text, strlen($text));

        $this->assertStringEndsWith('\<', $clean);
    }
}
 