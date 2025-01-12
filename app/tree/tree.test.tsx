import { render as testingLibraryRender } from '@testing-library/react';
import { createTheme, MantineProvider, mergeThemeOverrides, Modal } from '@mantine/core';
import { theme } from '../../theme';
import { fireEvent, userEvent, screen } from '@/test-utils';
import Tree from './page';

interface Node {
  value: string
  isRed: boolean
  left? : Node
  right? : Node
}

const nil : Node = { value : 'Null', isRed : false };

// Groundwork to test the visual pop ups properly
const testTheme = mergeThemeOverrides(
  theme,
  createTheme({
    components: {
      Modal: Modal.extend({
        defaultProps: {
          transitionProps: { duration: 0 },
        },
      }),
    },
  })
);

async function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  });
}

function switchExplanation() {
  const explanationToggle : HTMLElement = screen.getByLabelText('Explanation');
  fireEvent.click(explanationToggle);
}

function switchNulls() {
  const nullToggle : HTMLElement = screen.getByLabelText('Show Nulls');
  fireEvent.click(nullToggle);
}

function switchValues() {
  const valueToggle : HTMLElement = screen.getByLabelText('Show Values');
  fireEvent.click(valueToggle);
}

async function doOperationsVerbose(nums : number[]) {
  await doOperations(nums, true);
}

async function doOperationsQuiet(nums : number[]) {
  await doOperations(nums, false);
}

// Carries out the operations on the tree given by nums in sequence
// verbose controls alerts
// nums[i] > 0 => insert nums[i], nums[i] < 0 => delete nums[i]
async function doOperations(nums : number[], verbose : boolean) {
  async function insertOne(num : number) {
    const insertInput : HTMLElement = screen.getByTestId('insertInput');
    await userEvent.type(insertInput, String(num));
    const insertButton : HTMLElement = screen.getByText('Insert');
    fireEvent.click(insertButton);
  }

  async function deleteOne(num : number) {
    const deleteInput : HTMLElement = screen.getByTestId('deleteInput');
    await userEvent.type(deleteInput, String(num));
    const deleteButton : HTMLElement = screen.getByText('Delete');
    fireEvent.click(deleteButton);
  }

  switchExplanation();

  for(let i = 0; i < nums.length; i++) {
    if(i === nums.length - 1 && verbose) {
      switchExplanation();
    }

    if(nums[i] > 0) {
      await insertOne(nums[i]);
    }
    else {
      await deleteOne(-nums[i]);
    }
  }

  if(!verbose) {
    switchExplanation();
  }
}

// Returns whether the nodes displayed on the screen match the tree gievn by root
function doesScreenMatch(expectedRoot : Node) : boolean {
  function preorder(cur : Node) : Node[] {
    const ans : Node[] = [];
    ans.push(cur);
    if(cur.left) {
      ans.push(...preorder(cur.left));
    }
    if(cur.right) {
      ans.push(...preorder(cur.right));
    }
    return ans;
  }

  const expectedNodes : Node[] = preorder(expectedRoot)

  // Slicing at 3 because there are 3 non-node buttons (insert, delete, reset tree)
  const screenNodes : HTMLElement[] = screen.getAllByRole('button').slice(3);

  if(screenNodes.length !== expectedNodes.length) {
    return false;
  }

  for(let i = 0; i < expectedNodes.length; i++) {
    if(screenNodes[i].textContent !== expectedNodes[i].value) {
      return false;
    }

    const screenNodeIsRed : boolean = screenNodes[i].style.getPropertyValue('--button-bg') !== 'black';

    if(screenNodeIsRed !== expectedNodes[i].isRed) {
      return false;
    }
  }

  return true;
}

describe('Sliders', () => {
  it('Nulls Can Be Hidden', () => {
    render(<Tree />);

    // Null is there
    expect(screen.getByText('Null')).toBeInTheDocument();

    // Turn nulls off
    switchNulls();

    // Null is not there
    expect(() => screen.getByText('Null')).toThrow();
  })

  it('Values Can Be Hidden', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500]);

    // Value is there
    expect(screen.getByText(String(500))).toBeInTheDocument();

    // Turn values off
    switchValues();

    // Value is not there
    expect(() => screen.getByText(String(500))).toThrow();
  })

  it('Explanations Can Be Hidden', async () => {
    render(<Tree />);

    // Turn alerts off
    switchExplanation();

    await doOperationsVerbose([+500]);

    // There is no explanation for the insert
    expect(() => screen.getByText('Turn Root Black')).toThrow();
  })
})

describe('Insert Notification', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500]);

    // Should receive explanation stating that the root needs to be turned black
    expect(screen.getByText('Turn Root Black')).toBeInTheDocument();
  });

  it('Black Parent Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750]);

    // Should receive explanation stating that the the add can go through w/o changes
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  });

  it('Red Outside Notification (On the right)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, +875]);

    // Should receive explanation saying to do a left rotation
    expect(screen.getByText('Red Alert - Left Rotate and Swap Colors')).toBeInTheDocument();
  })

  it('Red Outside Notification (On the left)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +125]);

    // Should receive explanation saying to do a right rotation
    expect(screen.getByText('Red Alert - Right Rotate and Swap Colors'));
  })

  it('Red Inside Notification (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, +625]);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Right Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red Inside Notification (Less than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +375]);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Left Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red with Red Parent with Red Sibling Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625]);

    // Should receive explanation saying to recolor the parents and grandparent and recheck
    expect(screen.getByText('Red Alert - Recolor and Move Up')).toBeInTheDocument();
  })
});

describe('Delete Notification', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, -500]);

    // Should receive explanation that deleting root does not cause problem and we can proceed
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  })

  it('Red Leaf Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, -750]);

    // Should receive explanation that we can safely remove red node without futher problems
    expect(screen.getByText('Simply Remove the Red Node')).toBeInTheDocument();
  })

  it('Black with One Red Child Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, -500]);

    // Should receive explanation that we must replace the black node with its red child
    expect(screen.getByText('Replace Parent with Red Child Turned Black')).toBeInTheDocument();
  })

  it('Node with Two Children Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, -500]);

    // Should receive explanation that we first need to find the in-order predecessor
    expect(screen.getByText('Replace Value with In-Order Predecessor to Get One Child')).toBeInTheDocument();
  })

  it('Black with a Red Sibling Notification (Right child)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +125, +375, +62, -750]);

    // Should receive explanation to right rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Black with a Red Sibling Notification (Left child)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, +875, +562, -250]);

    // Should receive explanation to left rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Black with a Black Sibling with a Red Child on the Outside Notification (Right side)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +875, -250]);

    // Should receive explantion to left rotate the sibling up
    expect(screen.getByText('Lack of Black - Left Rotate and Color New Children Black')).toBeInTheDocument();
  })

  it('Black with a Black Sibling with a Red Child on the Outside Notification (Left side)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +125, -750]);

    // Should receive explantion to right rotate the sibling up
    expect(screen.getByText('Lack of Black - Right Rotate and Color New Children Black')).toBeInTheDocument();
  })
  
  it('Black with a Black Sibling with a Red Child on the Inside Notification (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, -250]);

    // Should receive notification that we need to right rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Black with a Black Sibling with a Red Child on the Inside Notification (Less than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +375, -750]);

    // Should receive notification that we need to left rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Black with a Red Parent and Black Sibling with no Red Child Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, +875, +937, -937, -875]);

    // Should receive notification that we need color sibling red and parent black
    expect(screen.getByText('Lack of Black - Swap Colors of Parent and Sibling')).toBeInTheDocument();
  })

  it('Black with a Black Parent and Black Sibling with no Red Child Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +875, -875, -750]);

    // Should receive notification that we need color sibling red move the issue upwards
    expect(screen.getByText('Lack of Black - Color Sibling Red and Move Up')).toBeInTheDocument();
  })
})

describe('Insert Tree Makeup', () => {
  it('Root', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500]);

    const expectedRoot : Node = { value : '500', isRed : false, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black Parent', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750]);

    const expectedRoot : Node = { value : '500', isRed : false, left : nil };
    expectedRoot.right = { value : '750', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  });

  it('Red Outside (On the right)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, +875]);

    const expectedRoot : Node = { value : '750', isRed : false };
    expectedRoot.left = { value : '500', isRed : true, left : nil, right : nil };
    expectedRoot.right = { value : '875', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Red Outside (On the left)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +125]);

    const expectedRoot : Node = { value : '250', isRed : false };
    expectedRoot.left = { value : '125', isRed : true, left : nil, right : nil };
    expectedRoot.right = { value : '500', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Red Inside (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, +625]);

    const expectedRoot : Node = { value : '625', isRed : false };
    expectedRoot.left = { value : '500', isRed : true, left : nil, right : nil };
    expectedRoot.right = { value : '750', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Red Inside (Less than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +375]);

    const expectedRoot : Node = { value : '375', isRed : false };
    expectedRoot.left = { value : '250', isRed : true, left : nil, right : nil };
    expectedRoot.right = { value : '500', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Red with Red Parent with Red Sibling', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +625]);

    const expectedRoot : Node = { value : '500', isRed : false };
    expectedRoot.left = { value : '250', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '750', isRed : false, right : nil };
    expectedRoot.right.left = { value : '625', isRed: true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })
});

describe('Delete Tree Makeup', () => {
  it('Root', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, -500]);

    const expectedRoot : Node = nil;

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Red Leaf', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, -750]);

    const expectedRoot : Node = { value : '500', isRed : false, left: nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with One Red Child', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, -500]);

    const expectedRoot : Node = { value : '750', isRed : false, left: nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Node with Two Children', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, -500]);

    const expectedRoot : Node = { value : '250', isRed : false, left: nil };
    expectedRoot.right = { value : '750', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Red Sibling (Right child)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +125, +375, +62, -750]);

    const expectedRoot : Node = { value : '250', isRed : false };
    expectedRoot.left = { value : '125', isRed : false, right : nil };
    expectedRoot.right = { value : '500', isRed : false, right : nil };
    expectedRoot.left.left = { value : '62', isRed : true, left : nil, right : nil };
    expectedRoot.right.left = {value : '375', isRed : true, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Red Sibling (Left child)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +625, +875, +562, -250]);

    const expectedRoot : Node = { value : '750', isRed : false };
    expectedRoot.left = { value : '562', isRed : true };
    expectedRoot.right = { value : '875', isRed : false, left : nil, right : nil };
    expectedRoot.left.left = { value : '500', isRed : false, left : nil, right : nil };
    expectedRoot.left.right = {value : '625', isRed : false, left : nil, right : nil };

    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Black Sibling with a Red Child on the Outside (Right side)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +875, -250]);

    const expectedRoot : Node = { value : '750', isRed : false };
    expectedRoot.left = { value : '500', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '875', isRed : false, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Black Sibling with a Red Child on the Outside (Left side)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +125, -750]);

    const expectedRoot : Node = { value : '250', isRed : false };
    expectedRoot.left = { value : '125', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '500', isRed : false, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })
  
  it('Black with a Black Sibling with a Red Child on the Inside (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +625, -250]);

    const expectedRoot : Node = { value : '625', isRed : false };
    expectedRoot.left = { value : '500', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '750', isRed : false, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Black Sibling with a Red Child on the Inside (Less than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +375, -750]);

    const expectedRoot : Node = { value : '375', isRed : false };
    expectedRoot.left = { value : '250', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '500', isRed : false, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Red Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +625, +875, +937, -937, -875]);

    const expectedRoot : Node = { value : '500', isRed : false };
    expectedRoot.left = { value : '250', isRed : false, left : nil, right : nil };
    expectedRoot.right = { value : '750', isRed : false, right : nil };
    expectedRoot.right.left = { value : '625', isRed : true, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })

  it('Black with a Black Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +875, -875, -750]);

    const expectedRoot : Node = { value : '500', isRed : false, right : nil };
    expectedRoot.left = { value : '250', isRed : true, left : nil, right : nil };
  
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
  })
})

describe('Putting It All Together', () => {
  it('Step by Step with Complex Examples', async () => {
    render(<Tree />);

    // Root
    await doOperationsQuiet([+500]); 
    let expectedRoot : Node = { value : '500', isRed : false, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black Parent
    await doOperationsQuiet([+750]);
    expectedRoot.right = { value : '750', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red on Outside (Right)
    await doOperationsQuiet([+875]);
    expectedRoot.value = '750';
    expectedRoot.right.value = '875';
    expectedRoot.left = { value : '500', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red with Parent's Sibling Red -> Root
    await doOperationsQuiet([+250]); 
    expectedRoot.left.isRed = false;
    expectedRoot.right.isRed = false;
    expectedRoot.left.left = { value : '250', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red on Inside (< Root) -> Double Red on Outside (Left)
    await doOperationsQuiet([+375]);
    expectedRoot.left.value = '375';
    expectedRoot.left.right = { value : '500', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black Parent
    await doOperationsQuiet([+825]);
    expectedRoot.right.left = { value : '825', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red on Outside (Left)
    await doOperationsQuiet([+775]);
    expectedRoot.right.value = '825';
    expectedRoot.right.left.value = '775';
    expectedRoot.right.right = { value : '875', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red with Parent's Sibling Red -> Black Parent
    await doOperationsQuiet([+325]); 
    expectedRoot.left.isRed = true;
    expectedRoot.left.left.isRed = false;
    expectedRoot.left.right.isRed = false;
    expectedRoot.left.left.right = { value : '325', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Double Red on Inside (> Root) -> Double Red on Outside (Right)
    await doOperationsQuiet([+275]);
    expectedRoot.left.left.value = '275';
    expectedRoot.left.left.left = { value : '250', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Red Leaf
    await doOperationsQuiet([-875]);
    expectedRoot.right.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black with One Red Child
    await doOperationsQuiet([-825]);
    expectedRoot.right.value = '775';
    expectedRoot.right.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black (Right child) with a Red Sibling -> Black with a Black Sibling and Red Parent
    await doOperationsQuiet([-775]);
    expectedRoot = expectedRoot.left;
    expectedRoot.isRed = false;
    expectedRoot.right = { value : '750', isRed : false, right : nil };
    expectedRoot.right.left = { value : '500', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black Parent
    await doOperationsQuiet([+900]);
    expectedRoot.right.right = { value : '900', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red with Parent's Sibling Red -> Black Parent
    await doOperationsQuiet([+925]); 
    expectedRoot.right.isRed = true;
    expectedRoot.right.left.isRed = false;
    expectedRoot.right.right.isRed = false;
    expectedRoot.right.right.right = { value : '925', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Double Red on Outside (Right)
    await doOperationsQuiet([+950]);
    expectedRoot.right.right.value = '925';
    expectedRoot.right.right.right.value = '950';
    expectedRoot.right.right.left = { value : '900', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red with Parent's Sibling Red -> Double Red on Outside (Right)
    await doOperationsQuiet([+975]); 
    let oldRoot : Node = expectedRoot;
    expectedRoot = oldRoot.right!;
    expectedRoot.isRed = false;
    expectedRoot.right!.isRed = true;
    expectedRoot.right!.left.isRed = false;
    expectedRoot.right!.right.isRed = false;
    expectedRoot.right!.right.right = { value : '975', isRed : true, left : nil, right : nil };
    oldRoot.isRed = true;
    oldRoot.right = expectedRoot.left;
    expectedRoot.left = oldRoot;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Red Leaf x2
    await doOperationsQuiet([-250, -325]);
    expectedRoot.left.left!.left = nil;
    expectedRoot.left.left!.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with a Black Sibling, Red Parent
    await doOperationsQuiet([-500]);
    expectedRoot.left.isRed = false;
    expectedRoot.left.left!.isRed = true;
    expectedRoot.left.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with Black Sibling with Outside Red (Right)
    await doOperationsQuiet([-900]);
    expectedRoot.right!.value = '950';
    expectedRoot.right!.right = expectedRoot.right!.right.right;
    expectedRoot.right!.right.isRed = false;
    expectedRoot.right!.left.value = '925';
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Two Children -> Black with One Red Child
    await doOperationsQuiet([-750]);
    expectedRoot.value = '375';
    expectedRoot.left.value = '275';
    expectedRoot.left.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black (Left child) with a Red Sibling -> Black with a Black Sibling and Red Parent
    await doOperationsQuiet([-275]);
    expectedRoot = expectedRoot.right!;
    expectedRoot.isRed = false;
    expectedRoot.left = { value : '375', isRed : false, left : nil };
    expectedRoot.left.right = { value : '925', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Black with Black Sibling with Inside Red (Less than root)
    await doOperationsQuiet([-975]);
    expectedRoot.value = '925';
    expectedRoot.right!.value = '950';
    expectedRoot.left.isRed = false;
    expectedRoot.left.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black Parent x4
    await doOperationsQuiet([+100, +600, +940, +960]);
    expectedRoot.left.left = { value : '100', isRed : true, left : nil, right : nil };
    expectedRoot.left.right = { value : '600', isRed : true, left : nil, right : nil };
    expectedRoot.right!.left = { value : '940', isRed : true, left : nil, right : nil };
    expectedRoot.right!.right = { value : '960', isRed : true, left : nil, right : nil };

    // Double Red with Parent's Sibling Red -> Black Parent
    await doOperationsQuiet([+400]); 
    expectedRoot.left.isRed = true;
    expectedRoot.left.left.isRed = false;
    expectedRoot.left.right.isRed = false;
    expectedRoot.left.right.left = { value : '400', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Double Red with Parent's Sibling Red -> Black Parent
    await doOperationsQuiet([+930]); 
    expectedRoot.right!.isRed = true;
    expectedRoot.right!.left.isRed = false;
    expectedRoot.right!.right.isRed = false;
    expectedRoot.right!.left.left = { value : '930', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with Black Sibling with Inside Red (Greater than root)
    await doOperationsQuiet([-100]);
    expectedRoot.left.value = '400';
    expectedRoot.left.left.value = '375';
    expectedRoot.left.right.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();
    
    // Black with Black Sibling with Outside Red (Left)
    await doOperationsQuiet([-960]);
    expectedRoot.right!.value = '940';
    expectedRoot.right!.left.value = '930';
    expectedRoot.right!.right.value = '950';
    expectedRoot.right!.left.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black Parent 
    await doOperationsQuiet([+200]);
    expectedRoot.left.left.left = { value : '200', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Double Red on Outside (Left)
    await doOperationsQuiet([+25]);
    expectedRoot.left.left.value = '200';
    expectedRoot.left.left.left.value = '25';
    expectedRoot.left.left.right = { value : '375', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy();

    // Double Red with Parent's Sibling Red -> Double Red with Parent's Sibling Red -> Root
    await doOperationsQuiet([+380]); 
    expectedRoot.left.isRed = false;
    expectedRoot.right!.isRed = false;
    expectedRoot.left.left.isRed = true;
    expectedRoot.left.left.left.isRed = false;
    expectedRoot.left.left.right.isRed = false;
    expectedRoot.left.left.right.right = { value : '380', isRed : true, left : nil, right : nil };
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with a Black Sibling, Black Parent -> Black with Black Sibling with Outside Red (Left)
    await doOperationsQuiet([-950]);
    oldRoot = expectedRoot;
    expectedRoot = oldRoot.left!;
    expectedRoot.left!.isRed = false;
    oldRoot.left = expectedRoot.right;
    expectedRoot.right = oldRoot;
    expectedRoot.right.right!.left!.isRed = true;
    expectedRoot.right.right!.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Red Leaf x2
    await doOperationsQuiet([-380, -930]);
    expectedRoot.left!.right.right = nil;
    expectedRoot.right.right!.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with a Black Sibling, Black Parent -> Black with a Black Sibling, Black Parent -> Root
    await doOperationsQuiet([-375]);
    expectedRoot.right.isRed = true;
    expectedRoot.left!.left.isRed = true;
    expectedRoot.left!.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with a Black Sibling, Red Parent 
    await doOperationsQuiet([-940]);
    expectedRoot.right.isRed = false;
    expectedRoot.right.left!.isRed = true;
    expectedRoot.right.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Red Leaf x2
    await doOperationsQuiet([-25, -600]);
    expectedRoot.left!.left = nil;
    expectedRoot.right.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Black with a Black Sibling, Black Parent -> Root
    await doOperationsQuiet([-200]);
    expectedRoot.right.isRed = true;
    expectedRoot.left = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Red Leaf
    await doOperationsQuiet([-925]);
    expectedRoot.right = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 

    // Root
    await doOperationsQuiet([-400]);
    expectedRoot = nil;
    expect(doesScreenMatch(expectedRoot)).toBeTruthy(); 
  }, 15000)
})